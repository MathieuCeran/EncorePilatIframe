const config = {
  // REQUIRED
  appName: "Encore Pilates Casablanca | Studio de Pilates, Reformer, Lagree",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "Encore Pilates est un studio de Pilates à Casablanca. Cours de pilates, Reformer et MicroPro Lagree. Coaching expert, petits groupes, résultats rapides.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "encorepilates.ma",

  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    from: `Encore Pilates <noreply@encorepilates.ma>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "support@encorepilates.ma",
  },

  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/signin",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: "/account",

    homeUrl: "/",
  },
};

export default config;
