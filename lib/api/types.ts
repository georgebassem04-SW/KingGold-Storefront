/**
 * API CONTRACT — the list of data functions the storefront needs.
 * Both mock.ts and http.ts must provide every function listed here.
 * Adding a new kind of data? Add the function here first, then in mock.ts and http.ts.
 */
import type {
  StoreSettings,
  Branch,
  Brand,
  Category,
  CheckoutOptions,
  ContentPage,
  GoldPrice,
  HomePage,
  MenuPage,
  Order,
  PlacedOrder,
  PlaceOrderRequest,
  Paginated,
  Product,
  ProductFilters,
  Quote,
  QuoteRequest,
  AddressInput,
  AuthResult,
  Offer,
  Customer,
  CustomerAuth,
  ProfileInput,
  SiteTheme,
} from "@/types";
import type { ContactMessage } from "@/lib/validation/contact";
import type { CustomRequestInput, CustomRequestPhoto } from "@/lib/validation/custom-request";

/**
 * The contract between the storefront and the data source.
 * mock.ts implements it with local JSON; http.ts will implement it with the real dashboard API.
 * Pages only ever import from "@/lib/api", so switching source needs no page changes.
 */
export interface StorefrontApi {
  /** Homepage blocks. `preview` = token from the dashboard's Homepage → Preview (shows the unpublished draft) */
  getHomePage(options?: { preview?: string }): Promise<HomePage>;
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  getBrands(): Promise<Brand[]>;
  getGoldPrices(): Promise<GoldPrice[]>;
  /** Special offers running now: automatic discounts on chosen products (no codes). Use getActiveOffers() in lib/offers.ts */
  getOffers(): Promise<Offer[]>;
  getProducts(filters?: ProductFilters): Promise<Paginated<Product>>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductsByIds(ids: string[]): Promise<Product[]>;

  /**
   * Content page from the dashboard page editor (about, faq, terms...). null = not found or not published.
   * `preview` = a short-lived token from the dashboard's "Preview" button: returns the unpublished draft (never cached).
   */
  getPage(slug: string, options?: { preview?: string }): Promise<ContentPage | null>;
  /** Published pages the dashboard placed in the top menu or the footer */
  getMenuPages(): Promise<MenuPage[]>;
  /** Physical shops, used by the branches block, contact page and store pickup (dashboard → Settings → Branches) */
  getBranches(): Promise<Branch[]>;
  /**
   * Contact details + social links (dashboard → Settings → Store details).
   * null = not set → config/clients/<client>.ts is used. Always go through getStoreContact() in lib/store-contact.ts.
   */
  getStoreSettings(): Promise<StoreSettings | null>;

  /**
   * The website look published from the dashboard (Theme & design): colours, fonts, logo, texts…
   * null = nothing published yet → the client defaults in config/clients/<client>.ts are used.
   * Always go through getSiteTheme() in lib/site-theme.ts (it checks every value).
   */
  getTheme(): Promise<Partial<SiteTheme> | null>;

  /** Sends a contact-form message to the dashboard (it appears there as a new inquiry) */
  sendContactMessage(message: ContactMessage): Promise<{ ok: boolean; reference?: string }>;
  /**
   * "Design your piece" request with the customer's photos (page /pages/customize, block "custom_order").
   * It appears in the dashboard → Customization requests. Photos are already checked (type + size).
   */
  sendCustomRequest(request: CustomRequestInput, photos: CustomRequestPhoto[]): Promise<{ ok: boolean; reference?: string }>;

  // ===== CHECKOUT =====
  /** Shipping zones, payment methods, VAT rule, minimum order, price-lock time */
  getCheckoutOptions(): Promise<CheckoutOptions>;
  /** Re-prices the cart with today's gold rate, checks stock, applies coupon/shipping/VAT */
  quoteOrder(request: QuoteRequest): Promise<Quote>;
  /** Creates the order in the dashboard (which sends it on to the ERP) */
  placeOrder(request: PlaceOrderRequest): Promise<PlacedOrder>;
  /** One order by its number (order success page). null = not found */
  getOrder(number: string): Promise<Order | null>;

  // ===== CUSTOMER ACCOUNTS =====
  // `auth` = the logged-in customer (from the session cookie). The dashboard checks auth.token.
  registerCustomer(input: { firstName: string; lastName: string; email: string; phone: string; password: string }): Promise<AuthResult>;
  loginCustomer(input: { email: string; password: string }): Promise<AuthResult>;
  /** Called after Google confirms who the person is. Creates the customer or links Google to an existing email. */
  loginWithGoogle(input: { googleId: string; email: string; firstName: string; lastName: string; avatarUrl?: string }): Promise<AuthResult>;
  getCustomer(auth: CustomerAuth): Promise<Customer | null>;
  updateCustomer(auth: CustomerAuth, input: ProfileInput): Promise<AuthResult>;
  /** currentPassword can be empty for Google-only accounts setting their first password */
  changePassword(auth: CustomerAuth, input: { currentPassword?: string; newPassword: string }): Promise<AuthResult>;
  addAddress(auth: CustomerAuth, input: AddressInput): Promise<Customer | null>;
  updateAddress(auth: CustomerAuth, id: string, input: AddressInput): Promise<Customer | null>;
  deleteAddress(auth: CustomerAuth, id: string): Promise<Customer | null>;
  /** Newest first */
  getCustomerOrders(auth: CustomerAuth): Promise<Order[]>;
  /** One of the customer's own orders (null if it belongs to someone else) */
  getCustomerOrder(auth: CustomerAuth, number: string): Promise<Order | null>;
}
