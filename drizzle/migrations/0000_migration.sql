CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  city text NOT NULL,
  km numeric NOT NULL DEFAULT 0,
  phone text,
  blood_group text NOT NULL,
  component text NOT NULL,
  units int NOT NULL DEFAULT 0,
  expiry_date date NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.inventory TO anon, authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inventory is public" ON public.inventory FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  blood_group text NOT NULL,
  city text NOT NULL,
  availability text NOT NULL DEFAULT 'Available now',
  consent_alerts boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.donors TO service_role;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  message text NOT NULL,
  recipients int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fn text NOT NULL,
  model text NOT NULL,
  ms int NOT NULL,
  ok boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_runs TO service_role;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

INSERT INTO public.inventory (bank_name, city, km, phone, blood_group, component, units, expiry_date) VALUES
('KEM Hospital Blood Bank','Mumbai',2.1,'+91 22 2410 7000','O−','Packed red cells',4,current_date+5),
('Tata Memorial Blood Centre','Mumbai',4.6,'+91 22 2417 7000','O−','Packed red cells',9,current_date+2),
('JJ Hospital Blood Bank','Mumbai',6.3,'+91 22 2373 5555','O−','Packed red cells',2,current_date+9),
('Lilavati Hospital Blood Bank','Mumbai',9.8,'+91 22 2675 1000','O−','Packed red cells',7,current_date+14),
('KEM Hospital Blood Bank','Mumbai',2.1,'+91 22 2410 7000','O−','Platelets',0,current_date+1),
('Tata Memorial Blood Centre','Mumbai',4.6,'+91 22 2417 7000','O−','Platelets',3,current_date+2),
('Lilavati Hospital Blood Bank','Mumbai',9.8,'+91 22 2675 1000','O−','Platelets',2,current_date+3),
('KEM Hospital Blood Bank','Mumbai',2.1,'+91 22 2410 7000','B+','Whole blood',22,current_date+20),
('JJ Hospital Blood Bank','Mumbai',6.3,'+91 22 2373 5555','B+','Whole blood',14,current_date+12),
('KEM Hospital Blood Bank','Mumbai',2.1,'+91 22 2410 7000','A+','Plasma',30,current_date+120),
('Sassoon General Blood Bank','Pune',1.8,'+91 20 2612 8000','B+','Platelets',5,current_date+2),
('Ruby Hall Clinic Blood Centre','Pune',3.9,'+91 20 6645 5100','B+','Platelets',8,current_date+3),
('Jehangir Hospital Blood Bank','Pune',5.2,'+91 20 6681 9999','O−','Packed red cells',3,current_date+6),
('Deenanath Mangeshkar Blood Bank','Pune',7.4,'+91 20 4015 1000','O−','Packed red cells',6,current_date+4),
('GMC Nagpur Blood Bank','Nagpur',2.4,'+91 712 274 3588','A−','Whole blood',2,current_date+7),
('Mayo Hospital Blood Centre','Nagpur',3.1,'+91 712 272 8123','A−','Whole blood',4,current_date+3),
('Lifeline Blood Bank','Nagpur',6.7,'+91 712 253 3330','O+','Packed red cells',18,current_date+10),
('AIIMS Blood Bank','Delhi',3.2,'+91 11 2658 8500','AB−','Plasma',3,current_date+90),
('Red Cross Blood Bank','Delhi',4.4,'+91 11 2371 6441','AB−','Plasma',5,current_date+60),
('Safdarjung Hospital Blood Bank','Delhi',5.9,'+91 11 2673 0000','O−','Packed red cells',5,current_date+3),
('Rotary Blood Bank','Delhi',11.2,'+91 11 2905 4066','O−','Packed red cells',12,current_date+8);

INSERT INTO public.donors (name, blood_group, city, availability, consent_alerts) VALUES
('Priya S.','O−','Mumbai','Available now',true),
('Rahul M.','O−','Mumbai','Weekends only',true),
('Anita K.','O−','Mumbai','Available now',false),
('Vikram P.','B+','Pune','Available now',true),
('Sneha D.','O−','Pune','Emergencies only',true),
('Arjun R.','AB−','Delhi','Available now',true),
('Meera J.','A−','Nagpur','Available now',false);