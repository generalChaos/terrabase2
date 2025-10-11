-- Add contact information columns to team_design_flows table
ALTER TABLE team_design_flows
ADD COLUMN contact_email VARCHAR;

ALTER TABLE team_design_flows
ADD COLUMN contact_phone VARCHAR;

-- Add index for contact_email for faster lookups
CREATE INDEX idx_team_design_flows_contact_email ON team_design_flows(contact_email);

-- Add index for contact_phone for faster lookups
CREATE INDEX idx_team_design_flows_contact_phone ON team_design_flows(contact_phone);
