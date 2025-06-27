-- Create contact_messages table for admin dashboard contact management
-- Run this SQL in your Supabase SQL editor to enable contact message functionality

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to read all messages
CREATE POLICY "Admins can read contact messages" ON contact_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create policy for admins to update message status
CREATE POLICY "Admins can update contact messages" ON contact_messages
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create policy to allow anyone to insert contact messages (for the contact form)
CREATE POLICY "Anyone can create contact messages" ON contact_messages
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_messages_updated_at();

-- Insert some sample data for testing (optional)
INSERT INTO contact_messages (name, email, phone, subject, category, message) VALUES
('John Doe', 'john@example.com', '+1234567890', 'Product Question', 'product', 'I have a question about your organic almonds. Are they really organic certified?'),
('Jane Smith', 'jane@example.com', NULL, 'Shipping Issue', 'shipping', 'My order has been delayed. Can you please provide an update?'),
('Bob Wilson', 'bob@example.com', '+1987654321', 'Bulk Order Inquiry', 'wholesale', 'I am interested in placing a bulk order for my restaurant. Can you provide wholesale pricing?')
ON CONFLICT DO NOTHING;
