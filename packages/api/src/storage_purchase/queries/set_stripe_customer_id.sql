UPDATE account
SET
  stripecustomerid = :stripeCustomerId,
  updateddt = CURRENT_TIMESTAMP
WHERE primaryemail = :email;
