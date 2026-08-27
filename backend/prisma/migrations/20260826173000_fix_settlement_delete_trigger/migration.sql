CREATE OR REPLACE FUNCTION prevent_settled_settlement_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."status" = 'SETTLED' THEN
    RAISE EXCEPTION 'Settled records are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
