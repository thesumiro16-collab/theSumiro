-- =============================================================================
-- Migration 024: RPC to disable countdown mode automatically (SECURITY DEFINER)
-- =============================================================================

CREATE OR REPLACE FUNCTION disable_countdown_mode()
RETURNS void
SECURITY DEFINER
AS $$
DECLARE
  settings_id UUID;
  settings_desc TEXT;
  settings_json JSONB;
BEGIN
  -- Retrieve the system settings record
  SELECT id, description INTO settings_id, settings_desc
  FROM designs
  WHERE design_no = 'SYSTEM_SETTINGS'
  LIMIT 1;

  IF settings_id IS NOT NULL THEN
    -- Parse description to JSONB, toggle countdown_mode to false, serialize back to TEXT
    settings_json := settings_desc::jsonb;
    settings_json := jsonb_set(settings_json, '{countdown_mode}', 'false');
    
    UPDATE designs
    SET description = settings_json::text
    WHERE id = settings_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
