/**
 * Helper functions for price calculations
 */

/**
 * Calculate final price with add-ons and discounts
 */
const calculateFinalPrice = (basePrice, addOns = [], discount = 0) => {
    const addOnTotal = addOns.reduce((total, addOn) => {
        return total + (addOn.price * (addOn.quantity || 1));
    }, 0);

    return Math.max(0, basePrice + addOnTotal - discount);
};

/**
 * Calculate discount amount based on type and value
 */
const calculateDiscount = (originalPrice, discountType, discountValue, maxDiscount = null) => {
    let discountAmount = 0;

    if (discountType === 'percentage') {
        discountAmount = (originalPrice * discountValue) / 100;
        if (maxDiscount !== null) {
            discountAmount = Math.min(discountAmount, maxDiscount);
        }
    } else if (discountType === 'fixed') {
        discountAmount = discountValue;
    }

    return Math.min(discountAmount, originalPrice);
};

/**
 * Calculate taxes
 */
const calculateTaxes = (amount, taxRates = []) => {
    const taxes = taxRates.map(tax => ({
        name: tax.name,
        rate: tax.rate,
        amount: (amount * tax.rate) / 100
    }));

    const totalTax = taxes.reduce((sum, tax) => sum + tax.amount, 0);

    return {
        taxes,
        totalTax,
        totalWithTax: amount + totalTax
    };
};

/**
 * Format price with currency
 */
const formatPrice = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

/**
 * Calculate worker earnings
 */
const calculateWorkerEarnings = (bookingAmount, commissionRate) => {
    const commission = (bookingAmount * commissionRate) / 100;
    const earnings = bookingAmount - commission;

    return {
        totalAmount: bookingAmount,
        commission,
        earnings
    };
};

/**
 * Calculate refund amount
 */
const calculateRefundAmount = (bookingAmount, cancellationTime, bookingTime, policies) => {
    const hoursDifference = (cancellationTime - bookingTime) / (1000 * 60 * 60);

    // Find applicable policy
    const policy = policies.find(p => hoursDifference >= p.hoursBeforeService);

    if (!policy) return 0;

    return (bookingAmount * policy.refundPercentage) / 100;
};

module.exports = {
    calculateFinalPrice,
    calculateDiscount,
    calculateTaxes,
    formatPrice,
    calculateWorkerEarnings,
    calculateRefundAmount
};
