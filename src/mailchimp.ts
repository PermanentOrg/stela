import MailChimpClient from "@mailchimp/mailchimp_marketing";

MailChimpClient.setConfig({
  apiKey: process.env["MAILCHIMP_API_KEY"] ?? "",
  server: process.env["MAILCHIMP_DATACENTER"] ?? "",
});

export { MailChimpClient };
