-- Add sort order column to marketplace_listings
ALTER TABLE marketplace_listings
ADD COLUMN IF NOT EXISTS profile_sort_order INTEGER DEFAULT 0;

-- Function to securely update the sort order of multiple listings in bulk
CREATE OR REPLACE FUNCTION update_listing_sort_orders(listing_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    i INTEGER;
BEGIN
    -- Ensure the user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Update each listing by giving it a sort index corresponding to its array position
    FOR i IN 1 .. array_length(listing_ids, 1) LOOP
        UPDATE marketplace_listings
        SET profile_sort_order = i
        WHERE id = listing_ids[i]
          AND user_id = auth.uid();
    END LOOP;
END;
$$;
