ALTER TABLE "payments"
ADD CONSTRAINT "payments_amount_positive_check"
CHECK ("amount" > 0),
ADD CONSTRAINT "payments_refunded_amount_bounds_check"
CHECK ("refundedAmount" >= 0 AND "refundedAmount" <= "amount");

ALTER TABLE "refunds"
ADD CONSTRAINT "refunds_amount_positive_check"
CHECK ("amount" > 0);

CREATE OR REPLACE FUNCTION enforce_refund_integrity()
RETURNS TRIGGER AS $$
DECLARE
  payment_row "payments"%ROWTYPE;
  next_refunded_amount DECIMAL(12, 2);
BEGIN
  IF NEW."status" <> 'COMPLETED' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO payment_row
  FROM "payments"
  WHERE "id" = NEW."paymentId"
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Refund payment does not exist';
  END IF;

  IF payment_row."organizationId" <> NEW."organizationId"
     OR payment_row."bookingId" <> NEW."bookingId" THEN
    RAISE EXCEPTION 'Refund tenant or booking does not match payment';
  END IF;

  next_refunded_amount := payment_row."refundedAmount" + NEW."amount";
  IF next_refunded_amount > payment_row."amount" THEN
    RAISE EXCEPTION 'Completed refunds exceed payment amount';
  END IF;

  UPDATE "payments"
  SET
    "refundedAmount" = next_refunded_amount,
    "status" = CASE
      WHEN next_refunded_amount = payment_row."amount" THEN 'REFUNDED'::"PaymentStatus"
      ELSE 'PARTIALLY_REFUNDED'::"PaymentStatus"
    END
  WHERE "id" = NEW."paymentId";

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "refund_integrity_before_insert"
BEFORE INSERT ON "refunds"
FOR EACH ROW
EXECUTE FUNCTION enforce_refund_integrity();
