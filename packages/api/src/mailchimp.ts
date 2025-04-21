import MailChimpClient from "@mailchimp/mailchimp_marketing";
import MailchimpTransactionalFactory from "@mailchimp/mailchimp_transactional";

const MailchimpTransactional = MailchimpTransactionalFactory(
	process.env["MAILCHIMP_TRANSACTIONAL_API_KEY"] ?? "",
);

const MailchimpMarketing = MailChimpClient;

MailchimpMarketing.setConfig({
	apiKey: process.env["MAILCHIMP_API_KEY"] ?? "",
	server: process.env["MAILCHIMP_DATACENTER"] ?? "",
});

export { MailchimpMarketing, MailchimpTransactional };
