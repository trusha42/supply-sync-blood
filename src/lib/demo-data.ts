export const BLOOD_GROUPS = [
  "O-",
  "O+",
  "A-",
  "A+",
  "B-",
  "B+",
  "AB-",
  "AB+",
] as const;

// Human-readable labels.
export const COMPONENTS = [
  "Whole blood",
  "Packed red cells",
  "Platelets",
  "Plasma",
] as const;

// Use these values when submitting to the backend.
export const COMPONENT_OPTIONS = [
  {
    label: "Whole blood",
    value: "whole_blood",
  },
  {
    label: "Packed red cells",
    value: "red_cells",
  },
  {
    label: "Platelets",
    value: "platelets",
  },
  {
    label: "Plasma",
    value: "plasma",
  },
] as const;

export const CITIES = [
  "Ahmedabad",
  "Amravati",
  "Bengaluru",
  "Bhopal",
  "Bhubaneswar",
  "Chandigarh",
  "Chennai",
  "Chhatrapati Sambhajinagar",
  "Coimbatore",
  "Delhi",
  "Hyderabad",
  "Indore",
  "Jaipur",
  "Jalgaon",
  "Kochi",
  "Kolhapur",
  "Kolkata",
  "Lucknow",
  "Ludhiana",
  "Madurai",
  "Mangaluru",
  "Mumbai",
  "Mysuru",
  "Nagpur",
  "Nanded",
  "Nashik",
  "Navi Mumbai",
  "Noida",
  "Patna",
  "Pimpri-Chinchwad",
  "Prayagraj",
  "Pune",
  "Raipur",
  "Rajkot",
  "Ranchi",
  "Sangli",
  "Satara",
  "Solapur",
  "Surat",
  "Thane",
  "Thiruvananthapuram",
  "Vadodara",
  "Varanasi",
  "Vijayawada",
  "Visakhapatnam",
] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export type Component = (typeof COMPONENTS)[number];

export type ComponentValue =
  (typeof COMPONENT_OPTIONS)[number]["value"];

export type City = (typeof CITIES)[number];