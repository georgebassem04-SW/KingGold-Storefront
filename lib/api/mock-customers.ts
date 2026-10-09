/**
 * MOCK CUSTOMER ACCOUNTS — sign up, log in (email or Google), profile, addresses, order history.
 * Saved in .mock-db/db.json. The real dashboard will do all of this in its own database.
 */
import "server-only";
import type { Customer } from "@/types";
import type { StorefrontApi } from "./types";
import { hashPassword, mutate, publicCustomer, read, verifyPassword, type StoredCustomer } from "./mock-db";

type CustomerApi = Pick<
  StorefrontApi,
  | "registerCustomer"
  | "loginCustomer"
  | "loginWithGoogle"
  | "getCustomer"
  | "updateCustomer"
  | "changePassword"
  | "addAddress"
  | "updateAddress"
  | "deleteAddress"
  | "getCustomerOrders"
  | "getCustomerOrder"
>;

const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`;

/** Makes sure exactly one address is the default */
function fixDefault(c: StoredCustomer, preferId?: string) {
  if (!c.addresses.length) return;
  const wanted = preferId ?? c.addresses.find((a) => a.isDefault)?.id ?? c.addresses[0].id;
  c.addresses = c.addresses.map((a) => ({ ...a, isDefault: a.id === wanted }));
}

function findCustomer(db: { customers: StoredCustomer[] }, id: string) {
  return db.customers.find((c) => c.id === id);
}

export const mockCustomerApi: CustomerApi = {
  async registerCustomer({ firstName, lastName, email, phone, password }) {
    return mutate((db) => {
      const existing = db.customers.find((c) => sameEmail(c.email, email));
      if (existing) return { ok: false as const, error: "email_taken" as const };
      const customer: StoredCustomer = {
        id: newId("cus"),
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phone,
        marketingOptIn: false,
        addresses: [],
        authProviders: ["password"],
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
      };
      db.customers.push(customer);
      return { ok: true as const, customer: publicCustomer(customer) };
    });
  },

  async loginCustomer({ email, password }) {
    const c = read((db) => db.customers.find((x) => sameEmail(x.email, email)));
    if (!c) return { ok: false, error: "invalid_credentials" };
    // Signed up with Google and never set a password
    if (!c.passwordHash) return { ok: false, error: "google_only" };
    if (!verifyPassword(password, c.passwordHash)) return { ok: false, error: "invalid_credentials" };
    // Stopped from the dashboard (checked after the password so it tells nothing to strangers)
    if (c.disabled) return { ok: false, error: "account_disabled" };
    return { ok: true, customer: publicCustomer(c) };
  },

  async loginWithGoogle({ googleId, email, firstName, lastName, avatarUrl }) {
    return mutate((db) => {
      // 1) Known Google account  2) same email already registered -> link Google to it  3) new customer
      let c = db.customers.find((x) => x.googleId === googleId) ?? db.customers.find((x) => sameEmail(x.email, email));
      if (c?.disabled) return { ok: false as const, error: "account_disabled" as const };
      if (c) {
        c.googleId = googleId;
        if (!c.authProviders.includes("google")) c.authProviders.push("google");
        if (!c.avatarUrl && avatarUrl) c.avatarUrl = avatarUrl;
      } else {
        c = {
          id: newId("cus"),
          firstName,
          lastName,
          email: email.toLowerCase(),
          phone: "",
          marketingOptIn: false,
          addresses: [],
          authProviders: ["google"],
          googleId,
          avatarUrl,
          createdAt: new Date().toISOString(),
        };
        db.customers.push(c);
      }
      return { ok: true as const, customer: publicCustomer(c) };
    });
  },

  async getCustomer(auth) {
    const c = read((db) => findCustomer(db, auth.customerId));
    return c ? publicCustomer(c) : null;
  },

  async updateCustomer(auth, input) {
    return mutate((db) => {
      const c = findCustomer(db, auth.customerId);
      if (!c) return { ok: false as const, error: "not_found" as const };
      if (db.customers.some((x) => x.id !== c.id && sameEmail(x.email, input.email))) {
        return { ok: false as const, error: "email_taken" as const };
      }
      Object.assign(c, { ...input, email: input.email.trim().toLowerCase() });
      return { ok: true as const, customer: publicCustomer(c) };
    });
  },

  async changePassword(auth, { currentPassword, newPassword }) {
    return mutate((db) => {
      const c = findCustomer(db, auth.customerId);
      if (!c) return { ok: false as const, error: "not_found" as const };
      // Google-only accounts can set a first password without the current one
      if (c.passwordHash && !verifyPassword(currentPassword ?? "", c.passwordHash)) {
        return { ok: false as const, error: "wrong_password" as const };
      }
      c.passwordHash = hashPassword(newPassword);
      if (!c.authProviders.includes("password")) c.authProviders.push("password");
      return { ok: true as const, customer: publicCustomer(c) };
    });
  },

  async addAddress(auth, input) {
    return mutate((db) => {
      const c = findCustomer(db, auth.customerId);
      if (!c) return null;
      const address = { ...input, id: newId("adr") };
      c.addresses.push(address);
      fixDefault(c, input.isDefault || c.addresses.length === 1 ? address.id : undefined);
      return publicCustomer(c) as Customer;
    });
  },

  async updateAddress(auth, id, input) {
    return mutate((db) => {
      const c = findCustomer(db, auth.customerId);
      const i = c?.addresses.findIndex((a) => a.id === id) ?? -1;
      if (!c || i < 0) return null;
      c.addresses[i] = { ...input, id };
      fixDefault(c, input.isDefault ? id : undefined);
      return publicCustomer(c);
    });
  },

  async deleteAddress(auth, id) {
    return mutate((db) => {
      const c = findCustomer(db, auth.customerId);
      if (!c) return null;
      c.addresses = c.addresses.filter((a) => a.id !== id);
      fixDefault(c);
      return publicCustomer(c);
    });
  },

  async getCustomerOrders(auth) {
    return read((db) =>
      db.orders.filter((o) => o.customerId === auth.customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },

  async getCustomerOrder(auth, number) {
    // Only the customer's own orders
    return read((db) => db.orders.find((o) => o.number === number && o.customerId === auth.customerId) ?? null);
  },
};
