const mongoose = require('mongoose');
const Coupon = require('./coupon.model');
const dotenv = require('dotenv');
const connectDB = require('../../config/db');

dotenv.config();

const seedCoupons = async () => {
    // Connect to database
    await connectDB();
    try {
        // First, delete any existing coupons
        await Coupon.deleteMany({});

        const coupons = [
            {
                code: 'WELCOME25',
                type: 'percentage',
                value: 25,
                maxDiscount: 500, // Maximum discount of ₹500
                minOrderValue: 500,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valid for 30 days
                description: 'Welcome discount for new customers - 25% off up to ₹500',
                maxUsage: 100,
                usageCount: 0
            },
            {
                code: 'FLAT200',
                type: 'fixed',
                value: 200,
                minOrderValue: 1000,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Valid for 60 days
                description: 'Flat ₹200 off on orders above ₹1000',
                maxUsage: 50,
                usageCount: 0
            },
            {
                code: 'SPECIAL15',
                type: 'percentage',
                value: 15,
                maxDiscount: 300,
                minOrderValue: 800,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Valid for 15 days
                description: '15% off up to ₹300 on orders above ₹800',
                maxUsage: 75,
                usageCount: 0
            },
            {
                code: 'FLASH50',
                type: 'percentage',
                value: 50,
                maxDiscount: 1000,
                minOrderValue: 2000,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Valid for 2 days only
                description: 'Flash sale! 50% off up to ₹1000 on orders above ₹2000',
                maxUsage: 25,
                usageCount: 0
            }
        ];

        // Insert the coupons
        await Coupon.insertMany(coupons);
        console.log('Coupons seeded successfully!');
        console.log('Available coupons:');
        coupons.forEach(coupon => {
            console.log(`
            Code: ${coupon.code}
            Type: ${coupon.type}
            Value: ${coupon.value}${coupon.type === 'percentage' ? '%' : '₹'}
            Min Order: ₹${coupon.minOrderValue}
            ${coupon.type === 'percentage' ? `Max Discount: ₹${coupon.maxDiscount}` : ''}
            Valid Until: ${coupon.validUntil.toLocaleDateString()}
            Max Usage: ${coupon.maxUsage}
            `);
        });

    } catch (error) {
        console.error('Error seeding coupons:', error);
    } finally {
        // List all coupons after seeding
        const allCoupons = await Coupon.find({});
        console.log('\nCurrent coupons in database:', allCoupons.length);
        allCoupons.forEach(coupon => {
            console.log(`
Code: ${coupon.code}
Valid: ${new Date() >= coupon.validFrom && new Date() <= coupon.validUntil ? 'Yes' : 'No'}
Valid From: ${coupon.validFrom}
Valid Until: ${coupon.validUntil}
            `);
        });
        
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('Database connection closed');
        }
    }
};

// Run the seeder if this file is run directly
if (require.main === module) {
    seedCoupons()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Seeding failed:', err);
            process.exit(1);
        });
}

module.exports = seedCoupons;

// node modules/coupon/coupon.seed.js // to run the seeder
//please don't make any unnecessary coupons this can make us bankrupt 🥲🥲🥲