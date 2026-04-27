// ============================================================================
// CATEGORY_CONFIG — drives all category-specific UI and data
// ============================================================================
//
// Each category key maps to:
//   servicesLabel   — heading for the tags section (admin + preview)
//   servicesPlaceholder — placeholder text for adding tags
//   suggestedTags   — quick-add tag suggestions shown as chips
//   priceRange      — if true, show a $ / $$ / $$$ / $$$$ picker
//   bookingField    — { label, placeholder } if category supports a booking/order URL
//   extraFields     — array of { key, label, placeholder, type, options } for category-specific inputs
//                     type: 'text' | 'select' | 'multiselect' | 'toggle'
//   sectionTitle    — admin form section heading
//

const CATEGORY_CONFIG = {
    food_drink: {
        sectionTitle: 'Restaurant & Menu Details',
        servicesLabel: 'Menu Highlights',
        builder: { type: 'menu', dataKey: 'menu_sections', builderTitle: 'Menu' },
        servicesPlaceholder: 'e.g. Burgers, Seafood, Craft Beer',
        suggestedTags: [
            'Dine-In', 'Takeout', 'Delivery', 'Drive-Through', 'Catering',
            'Breakfast', 'Lunch', 'Dinner', 'Brunch', 'Late Night',
            'Bar & Grill', 'Seafood', 'BBQ', 'Pizza', 'Mexican',
            'Chinese', 'Italian', 'Southern', 'Farm-to-Table', 'Vegan-Friendly',
        ],
        priceRange: true,
        bookingField: { label: 'Order Online / Make a Reservation', previewLabel: 'Order Online', placeholder: 'https://order.yourrestaurant.com' },
        extraFields: [
            {
                key: 'cuisine_type',
                label: 'Cuisine Type',
                type: 'select',
                options: [
                    'American', 'Southern / Soul Food', 'BBQ', 'Seafood', 'Mexican',
                    'Italian', 'Chinese', 'Japanese', 'Thai', 'Indian', 'Mediterranean',
                    'Pizza', 'Burgers', 'Sandwiches & Deli', 'Cajun / Creole',
                    'Farm-to-Table', 'Bakery & Café', 'Ice Cream & Desserts',
                    'Food Truck', 'Other',
                ],
            },
            {
                key: 'dietary_options',
                label: 'Dietary Options',
                type: 'multiselect',
                options: [
                    'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal',
                    'Kosher', 'Nut-Free', 'Dairy-Free', 'Keto-Friendly',
                ],
            },
        ],
    },

    shopping_retail: {
        sectionTitle: 'Shop Details',
        servicesLabel: 'Products & Brands',
        builder: null,
        servicesPlaceholder: 'e.g. Clothing, Home Décor, Antiques',
        suggestedTags: [
            'Clothing', 'Shoes', 'Jewelry', 'Home Décor', 'Antiques',
            'Thrift & Vintage', 'Gifts', 'Books', 'Sporting Goods',
            'Electronics', 'Handmade / Local', 'Farm & Feed', 'Outdoor Gear',
        ],
        priceRange: true,
        bookingField: { label: 'Shop Online', previewLabel: 'Shop Now', placeholder: 'https://shop.yourbusiness.com' },
        extraFields: [],
    },

    automotive: {
        sectionTitle: 'Automotive Details',
        servicesLabel: 'Services & Specialties',
        builder: { type: 'service_menu', dataKey: 'service_menu', durationEnabled: false, builderTitle: 'Services' },
        servicesPlaceholder: 'e.g. Oil Changes, Brake Repair, Tires',
        suggestedTags: [
            'Oil Change', 'Brake Repair', 'Tire Service', 'Engine Repair',
            'Transmission', 'A/C Repair', 'Body Work', 'Detailing',
            'Car Sales', 'Towing', 'Inspection', 'Custom / Performance',
            'Diesel', 'Fleet Service', 'Alignment', 'Exhaust',
        ],
        priceRange: true,
        bookingField: { label: 'Schedule an Appointment', previewLabel: 'Book Appointment', placeholder: 'https://book.yourshop.com' },
        extraFields: [
            {
                key: 'brands_serviced',
                label: 'Brands / Makes Serviced',
                type: 'text',
                placeholder: 'e.g. All Makes, Ford, Chevy, Toyota',
            },
            {
                key: 'certifications',
                label: 'Certifications',
                type: 'text',
                placeholder: 'e.g. ASE Certified, AAA Approved',
            },
        ],
    },

    home_services: {
        sectionTitle: 'Home Service Details',
        servicesLabel: 'Services & Pricing',
        builder: { type: 'service_menu', dataKey: 'service_menu', durationEnabled: false, builderTitle: 'Services' },
        servicesPlaceholder: 'e.g. Plumbing, Electrical, HVAC',
        suggestedTags: [
            'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Painting',
            'Flooring', 'Carpentry', 'Pressure Washing', 'Pest Control',
            'Locksmith', 'Handyman', 'Remodeling', 'Concrete',
            'Gutters', 'Insulation', 'Septic', 'Well Service',
        ],
        priceRange: false,
        bookingField: { label: 'Request a Free Quote', previewLabel: 'Get a Quote', placeholder: 'https://yourbusiness.com/quote' },
        extraFields: [
            {
                key: 'free_estimates',
                label: 'Free Estimates',
                type: 'toggle',
            },
            {
                key: 'licensed_insured',
                label: 'Licensed & Insured',
                type: 'toggle',
            },
            {
                key: 'service_area',
                label: 'Service Area',
                type: 'text',
                placeholder: 'e.g. Calhoun County & surrounding areas',
            },
        ],
    },

    home_garden: {
        sectionTitle: 'Home & Garden Details',
        servicesLabel: 'Products & Services',
        builder: null,
        servicesPlaceholder: 'e.g. Landscaping, Nursery, Lawn Care',
        suggestedTags: [
            'Landscaping', 'Lawn Care', 'Tree Service', 'Nursery',
            'Gardening Supplies', 'Mulch & Soil', 'Fencing',
            'Irrigation', 'Hardscaping', 'Stump Removal',
        ],
        priceRange: false,
        bookingField: null,
        extraFields: [
            {
                key: 'free_estimates',
                label: 'Free Estimates',
                type: 'toggle',
            },
        ],
    },

    health_wellness: {
        sectionTitle: 'Health & Wellness Details',
        servicesLabel: 'Services & Providers',
        builder: { type: 'provider', dataKey: 'providers', roleLabel: 'Specialty', builderTitle: 'Our Team' },
        servicesPlaceholder: 'e.g. Family Medicine, Chiropractic, Counseling',
        suggestedTags: [
            'Family Medicine', 'Pediatrics', 'Dentistry', 'Orthodontics',
            'Chiropractic', 'Physical Therapy', 'Mental Health', 'Counseling',
            'Optometry', 'Dermatology', 'Urgent Care', 'Pharmacy',
            'Home Health', 'Wellness Coaching', 'Nutrition',
        ],
        priceRange: false,
        bookingField: { label: 'Schedule a Visit', previewLabel: 'Book Appointment', placeholder: 'https://portal.yourpractice.com' },
        extraFields: [
            {
                key: 'insurance_accepted',
                label: 'Insurance Accepted',
                type: 'text',
                placeholder: 'e.g. BCBS, Medicaid, United, Most Major Insurers',
            },
            {
                key: 'accepting_patients',
                label: 'Accepting New Patients',
                type: 'toggle',
            },
        ],
    },

    beauty_personal_care: {
        sectionTitle: 'Salon & Beauty Details',
        servicesLabel: 'Services & Pricing',
        builder: { type: 'service_menu', dataKey: 'service_menu', durationEnabled: true, builderTitle: 'Services' },
        servicesPlaceholder: 'e.g. Haircuts, Color, Nails, Facials',
        suggestedTags: [
            'Haircuts', 'Color & Highlights', 'Blowouts', 'Extensions',
            'Nails', 'Gel / Acrylic', 'Facials', 'Waxing', 'Lashes',
            'Brows', 'Massage', 'Spray Tan', 'Makeup', 'Barbershop',
            'Men\'s Grooming', 'Bridal',
        ],
        priceRange: true,
        bookingField: { label: 'Book an Appointment', previewLabel: 'Book Now', placeholder: 'https://book.yoursalon.com' },
        extraFields: [
            {
                key: 'walk_ins',
                label: 'Walk-Ins Welcome',
                type: 'toggle',
            },
        ],
    },

    fitness_recreation: {
        sectionTitle: 'Fitness & Recreation Details',
        servicesLabel: 'Programs & Memberships',
        builder: { type: 'class', dataKey: 'classes', itemLabel: 'Class', builderTitle: 'Classes & Programs' },
        servicesPlaceholder: 'e.g. Personal Training, Yoga, CrossFit',
        suggestedTags: [
            'Personal Training', 'Group Classes', 'Yoga', 'Pilates',
            'CrossFit', 'Martial Arts', 'Swimming', 'Dance',
            'Rock Climbing', 'Bowling', 'Golf', 'Shooting Range',
            'Camping', 'Fishing', 'Hunting', 'ATV / Off-Road',
        ],
        priceRange: true,
        bookingField: { label: 'Join / Sign Up', previewLabel: 'Join Now', placeholder: 'https://join.yourgym.com' },
        extraFields: [
            {
                key: 'amenities',
                label: 'Amenities',
                type: 'multiselect',
                options: [
                    'Locker Rooms', 'Showers', 'Sauna', 'Pool',
                    'Childcare', 'Free Parking', 'Wi-Fi', '24/7 Access',
                ],
            },
        ],
    },

    professional_services: {
        sectionTitle: 'Professional Service Details',
        servicesLabel: 'Practice Areas',
        builder: { type: 'provider', dataKey: 'providers', roleLabel: 'Practice Area', builderTitle: 'Our Team' },
        servicesPlaceholder: 'e.g. Tax Preparation, Family Law, Real Estate',
        suggestedTags: [
            'Accounting', 'Tax Preparation', 'Bookkeeping', 'Family Law',
            'Criminal Defense', 'Personal Injury', 'Real Estate',
            'Insurance', 'Financial Planning', 'Marketing',
            'Web Design', 'Photography', 'Consulting', 'Notary',
        ],
        priceRange: false,
        bookingField: { label: 'Schedule a Consultation', previewLabel: 'Book Consultation', placeholder: 'https://calendly.com/yourfirm' },
        extraFields: [
            {
                key: 'credentials',
                label: 'Credentials & Licenses',
                type: 'text',
                placeholder: 'e.g. CPA, JD, Licensed Real Estate Agent',
            },
            {
                key: 'consultation_type',
                label: 'Consultation Type',
                type: 'select',
                options: ['Free Consultation', 'Paid Consultation', 'By Appointment Only', 'Walk-In Welcome'],
            },
        ],
    },

    education_childcare: {
        sectionTitle: 'Education & Childcare Details',
        servicesLabel: 'Learning Areas',
        builder: { type: 'class', dataKey: 'classes', itemLabel: 'Program', builderTitle: 'Programs & Classes' },
        servicesPlaceholder: 'e.g. Pre-K, Tutoring, After-School',
        suggestedTags: [
            'Pre-K', 'Daycare', 'After-School', 'Summer Camp',
            'Tutoring', 'Music Lessons', 'Art Classes', 'Dance Lessons',
            'Homeschool Co-op', 'Test Prep', 'Trade School', 'CDL Training',
        ],
        priceRange: true,
        bookingField: { label: 'Enroll / Register', previewLabel: 'Enroll Now', placeholder: 'https://enroll.yourschool.com' },
        extraFields: [
            {
                key: 'age_groups',
                label: 'Age Groups Served',
                type: 'text',
                placeholder: 'e.g. Ages 2-12, All Ages, Adults Only',
            },
        ],
    },

    pets_animals: {
        sectionTitle: 'Pet & Animal Service Details',
        servicesLabel: 'Services',
        builder: { type: 'service_menu', dataKey: 'service_menu', durationEnabled: false, builderTitle: 'Services' },
        servicesPlaceholder: 'e.g. Grooming, Boarding, Vet Care',
        suggestedTags: [
            'Veterinary Care', 'Grooming', 'Boarding', 'Pet Sitting',
            'Dog Training', 'Pet Supplies', 'Adoption', 'Breeding',
            'Farm & Livestock', 'Equine', 'Emergency Vet',
        ],
        priceRange: true,
        bookingField: { label: 'Book an Appointment', previewLabel: 'Book Now', placeholder: 'https://book.yourvet.com' },
        extraFields: [
            {
                key: 'animals_served',
                label: 'Animals Served',
                type: 'text',
                placeholder: 'e.g. Dogs, Cats, Horses, All Animals',
            },
        ],
    },

    travel_lodging: {
        sectionTitle: 'Travel & Lodging Details',
        servicesLabel: 'Property Features',
        builder: { type: 'accommodation', dataKey: 'accommodations', builderTitle: 'Accommodations' },
        servicesPlaceholder: 'e.g. Pool, Pet-Friendly, Lake Access',
        suggestedTags: [
            'Hotel', 'Motel', 'B&B', 'Cabin Rental', 'RV Park',
            'Campground', 'Lake House', 'Event Venue', 'Wedding Venue',
            'Conference Room', 'Pool', 'Pet-Friendly',
        ],
        priceRange: true,
        bookingField: { label: 'Book a Stay', previewLabel: 'Book a Stay', placeholder: 'https://book.yourlodging.com' },
        extraFields: [
            {
                key: 'amenities',
                label: 'Amenities',
                type: 'multiselect',
                options: [
                    'Pool', 'Hot Tub', 'Free Wi-Fi', 'Free Breakfast',
                    'Pet-Friendly', 'Kitchen', 'Laundry', 'Parking',
                    'Lake Access', 'Boat Dock', 'Fire Pit', 'Grill',
                ],
            },
        ],
    },

    arts_entertainment: {
        sectionTitle: 'Arts & Entertainment Details',
        servicesLabel: 'Shows & Offerings',
        builder: { type: 'class', dataKey: 'classes', itemLabel: 'Show', builderTitle: 'Shows & Events' },
        servicesPlaceholder: 'e.g. Live Music, Theater, Art Gallery',
        suggestedTags: [
            'Live Music', 'Theater', 'Comedy', 'Art Gallery', 'Museum',
            'Movie Theater', 'Arcade', 'Escape Room', 'Festivals',
            'Photography', 'DJ / Events', 'Paint & Sip', 'Pottery',
        ],
        priceRange: true,
        bookingField: { label: 'Get Tickets', previewLabel: 'Get Tickets', placeholder: 'https://tickets.yourvenue.com' },
        extraFields: [
            {
                key: 'venue_type',
                label: 'Venue Type',
                type: 'select',
                options: ['Bar / Club', 'Theater', 'Gallery', 'Museum', 'Outdoor Venue', 'Arena', 'Studio', 'Other'],
            },
        ],
    },

    community_nonprofit: {
        sectionTitle: 'Organization Details',
        servicesLabel: 'Our Mission & Programs',
        builder: null,
        servicesPlaceholder: 'e.g. Food Bank, Youth Programs, Shelter',
        suggestedTags: [
            'Food Bank', 'Shelter', 'Youth Programs', 'Senior Services',
            'Disaster Relief', 'Housing Assistance', 'Job Training',
            'Mentoring', 'Animal Rescue', 'Church / Ministry',
            'Civic Organization', 'Veteran Services',
        ],
        priceRange: false,
        bookingField: { label: 'Donate / Get Involved', previewLabel: 'Donate Now', placeholder: 'https://donate.yourorg.com' },
        extraFields: [
            {
                key: 'volunteer_link',
                label: 'Sign Up to Volunteer',
                type: 'text',
                placeholder: 'https://volunteer.yourorg.com',
            },
            {
                key: 'tax_id',
                label: 'EIN / Tax ID (public)',
                type: 'text',
                placeholder: 'e.g. 12-3456789',
            },
        ],
    },

    technology_repair: {
        sectionTitle: 'Tech & Repair Details',
        servicesLabel: 'Services & Pricing',
        builder: { type: 'service_menu', dataKey: 'service_menu', durationEnabled: true, builderTitle: 'Services' },
        servicesPlaceholder: 'e.g. Phone Repair, Computer Service, Networking',
        suggestedTags: [
            'Phone Repair', 'Computer Repair', 'Laptop Service', 'Data Recovery',
            'Networking', 'Security Cameras', 'Smart Home', 'Web Development',
            'IT Support', 'Printer Service', 'Console Repair', 'Screen Replacement',
        ],
        priceRange: true,
        bookingField: { label: 'Schedule a Repair', previewLabel: 'Book Repair', placeholder: 'https://repair.yourbusiness.com' },
        extraFields: [
            {
                key: 'turnaround',
                label: 'Typical Turnaround Time',
                type: 'select',
                options: ['Same Day', '24 Hours', '2-3 Days', '3-5 Days', '1 Week+', 'Varies'],
            },
            {
                key: 'warranty',
                label: 'Warranty on Repairs',
                type: 'select',
                options: ['30 Days', '60 Days', '90 Days', '6 Months', '1 Year', 'Lifetime', 'No Warranty'],
            },
        ],
    },

    other: {
        sectionTitle: 'Business Details',
        servicesLabel: 'What We Offer',
        builder: null,
        servicesPlaceholder: 'e.g. Add your services or offerings',
        suggestedTags: [],
        priceRange: false,
        bookingField: null,
        extraFields: [],
    },
};

// Default fallback for unknown categories
const DEFAULT_CATEGORY_CONFIG = CATEGORY_CONFIG.other;

export { CATEGORY_CONFIG, DEFAULT_CATEGORY_CONFIG };
