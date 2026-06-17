const Business = require("../models/Business");
const Review = require("../models/Review"); // Import Review Model
const Category = require("../models/Category");

const parseNumber = (val) => {
  if (val === undefined || val === null || val === "" || val === "undefined" || val === "null" || val === "NaN") {
    return null;
  }
  const num = Number(val);
  return isNaN(num) ? null : num;
};

const parseBoolean = (val) => {
  if (val === true || val === "true" || val === 1 || val === "1") {
    return true;
  }
  return false;
};

// ADD BUSINESS
exports.addBusiness = async (req, res) => {
  try {
    const {
      businessName,
      category,
      subcategories,
      ownerName,
      mobile,
      address,
      city,
      pincode,
      locationUrl,
      website,
      latitude,
      longitude,
      description,
      services,
      timings,
      isPaid,
      paidAmount,
      paidDays,
      socialLinks,
      userId: sentUserId  // 🔥 admin may send this
    } = req.body;

    let parsedTimings = timings;
    if (typeof timings === "string") {
      try { parsedTimings = JSON.parse(timings); } catch (e) { console.error("Timings parse error:", e); }
    }

    // 1️⃣ IMAGES
    const images = req.files ? req.files.map((f) => f.filename) : [];

    const parsedIsPaid = parseBoolean(isPaid);
    const parsedPaidDays = parseNumber(paidDays);
    const parsedPaidAmount = parseNumber(paidAmount);

    // 2️⃣ PAID LOGIC
    let paidExpiry = null;
    if (parsedIsPaid && parsedPaidDays) {
      paidExpiry = new Date();
      paidExpiry.setDate(paidExpiry.getDate() + parsedPaidDays);
    }

    // 3️⃣ USER ID LOGIC (AUTO DETECT)
    // If admin sends userId → use that
    // Else use logged-in user's id
    let userId = sentUserId || req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: "User ID missing" });
    }

    // 4️⃣ CREATE BUSINESS
    const business = await Business.create({
      businessName,
      category,
      subcategories,
      ownerName,
      mobile,
      address,
      city,
      pincode,
      locationUrl,
      website,
      latitude: parseNumber(latitude),
      longitude: parseNumber(longitude),
      description,
      services,
      socialLinks,
      timings: parsedTimings,
      images,
      isPaid: parsedIsPaid,
      paidAmount: parsedPaidAmount ?? 0,
      paidDays: parsedPaidDays ?? 0,
      paidExpiry,
      userId,
      status: false, // Default to Pending (False) until Admin approves
    });

    res.status(201).json({ message: "Business added successfully", business });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🆕 TOGGLE STATUS (Approve/Reject)
// 🆕 UPDATE APPROVAL STATUS (Approve/Reject)
exports.toggleBusinessStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // status: 'approved' | 'rejected' | 'pending'

    const business = await Business.findById(id);

    if (!business) return res.status(404).json({ message: "Business not found" });

    business.approvalStatus = status;

    if (status === 'rejected') {
      business.rejectionReason = reason || "Not specified";
      business.status = false; // Hide from public
    } else if (status === 'approved') {
      business.rejectionReason = "";
      business.status = true; // Show to public
    } else {
      business.status = false; // Pending
    }

    await business.save();

    res.status(200).json({
      message: `Business ${status}`,
      business
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🆕 BULK UPDATE STATUS (Approve / Reject multiple businesses)
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status, reason } = req.body;
    // ids: array of business _id strings
    // status: 'approved' | 'rejected' | 'pending'

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Please provide an array of business IDs" });
    }
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'approved', 'rejected', or 'pending'" });
    }

    const updateData = { approvalStatus: status };

    if (status === 'approved') {
      updateData.status = true;
      updateData.rejectionReason = "";
    } else if (status === 'rejected') {
      updateData.status = false;
      updateData.rejectionReason = reason || "Not specified";
    } else {
      updateData.status = false;
    }

    const result = await Business.updateMany(
      { _id: { $in: ids } },
      { $set: updateData }
    );

    res.status(200).json({
      message: `${result.modifiedCount} business(es) ${status} successfully`,
      modifiedCount: result.modifiedCount,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.updateBusiness = async (req, res) => {
  try {
    const id = req.params.id;

    const {
      businessName,
      category,
      subcategories,
      ownerName,
      mobile,
      address,
      city,
      pincode,
      locationUrl,
      website,
      latitude,
      longitude,
      description,
      services,
      timings,
      socialLinks,
      isPaid,
      paidAmount,
      paidDays
    } = req.body;

    let parsedUpdateTimings = timings;
    if (typeof timings === "string") {
      try { parsedUpdateTimings = JSON.parse(timings); } catch (e) { console.error("Timings parse error:", e); }
    }

    const updateData = {
      businessName,
      category,
      subcategories,
      ownerName,
      mobile,
      address,
      city,
      pincode,
      locationUrl,
      website,
      latitude: parseNumber(latitude),
      longitude: parseNumber(longitude),
      description,
      services: services || [],
      socialLinks: socialLinks || [],
      timings: parsedUpdateTimings
    };

    // New images uploaded?
    let finalImages = [];
    if (req.body.existingImages) {
      if (Array.isArray(req.body.existingImages)) {
        finalImages = [...req.body.existingImages];
      } else {
        finalImages.push(req.body.existingImages);
      }
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.filename);
      finalImages = [...finalImages, ...newImages];
    }
    updateData.images = finalImages;

    // Update Paid Details
    if (isPaid !== undefined && isPaid !== "undefined") {
      const parsedIsPaid = parseBoolean(isPaid);
      const parsedPaidDays = parseNumber(paidDays);
      const parsedPaidAmount = parseNumber(paidAmount);

      updateData.isPaid = parsedIsPaid;
      updateData.paidAmount = parsedPaidAmount ?? 0;
      updateData.paidDays = parsedPaidDays ?? 0;

      if (parsedIsPaid && parsedPaidDays) {
        let newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + parsedPaidDays);
        updateData.paidExpiry = newExpiry;
      }
    }

    const updated = await Business.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) return res.status(404).json({ message: "Business not found" });

    res.status(200).json({ message: "Business updated", updated });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getAllBusiness = async (req, res) => {
  try {
    const businesses = await Business.find()
      .populate("category")
      .populate("subcategories")
      .sort({ status: 1, isPaid: -1, paidExpiry: -1 }); // Pending (false/0) first, then Paid

    res.status(200).json(businesses);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBusinessById = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate("category")
      .populate("subcategories");

    if (!business) return res.status(404).json({ message: "Business not found" });

    // Fetch Reviews
    const reviews = await Review.find({ businessId: business._id }).populate("userId", "name profileImage");
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1)
      : 0;

    const businessWithRating = {
      ...business.toObject(),
      rating: parseFloat(avgRating),
      ratingCount: reviewCount,
      reviews: reviews // sending the populated review objects
    };

    res.status(200).json(businessWithRating);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBusiness = async (req, res) => {
  try {
    const deleted = await Business.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Business not found" });

    res.status(200).json({ message: "Business deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.totalbusiness = async (req, res) => {
  try {
    const total = await Business.countDocuments();
    res.status(200).json({ total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserBusinesses = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const businesses = await Business.find({ userId })
      .populate("category")
      .populate("subcategories")
      .sort({ createdAt: -1 });

    // Attach Ratings
    const businessesWithRatings = await Promise.all(
      businesses.map(async (biz) => {
        const reviews = await Review.find({ businessId: biz._id });
        const count = reviews.length;
        const avg = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
        return {
          ...biz.toObject(),
          rating: parseFloat(avg.toFixed(1)),
          ratingCount: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: businessesWithRatings.length,
      businesses: businessesWithRatings,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user businesses",
      error: error.message,
    });
  }
};

function buildFuzzyRegex(keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const words = escaped.split(/\s+/).filter(w => w.length > 0);
  
  const fuzzyWords = words.map(word => {
    if (word.length <= 2) return word;
    
    const patterns = [word];
    // 1. Vowels interchange (shipping -> shopping)
    patterns.push(word.replace(/[aeiou]/gi, '[aeiou]'));
    
    for (let i = 0; i < word.length; i++) {
      // 2. Substitution (one char changed)
      patterns.push(word.slice(0, i) + '.' + word.slice(i + 1));
      // 3. Deletion in keyword (user typed extra char, e.g. shooping -> shopping)
      patterns.push(word.slice(0, i) + word.slice(i + 1));
      // 4. Insertion in keyword (user missed a char, e.g. shping -> shopping)
      patterns.push(word.slice(0, i) + '.?' + word.slice(i));
    }
    return `(${patterns.join('|')})`;
  });
  
  return new RegExp(fuzzyWords.join('.*'), 'i');
}

exports.searchBusiness = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const keyword = q.trim();
    const fuzzyRegex = buildFuzzyRegex(keyword);
    const regexSource = fuzzyRegex.source;

    // Find matching categories
    const matchingCategories = await Category.find({
      name: { $regex: regexSource, $options: "i" }
    }).select('_id');
    const categoryIds = matchingCategories.map(c => c._id);

    const orConditions = [
      { businessName: { $regex: regexSource, $options: "i" } },
      { city: { $regex: regexSource, $options: "i" } },
      { address: { $regex: regexSource, $options: "i" } },
      { services: { $regex: regexSource, $options: "i" } },
    ];

    if (categoryIds.length > 0) {
      orConditions.push({ category: { $in: categoryIds } });
      orConditions.push({ subcategories: { $in: categoryIds } });
    }

    const businesses = await Business.find({
      status: true, // only active businesses
      $or: orConditions,
    })
      .populate("category")
      .populate("subcategories")
      .sort({ isPaid: -1, paidAmount: -1, createdAt: -1 }); // paid first, then higher amount

    // Attach Ratings
    const businessesWithRatings = await Promise.all(
      businesses.map(async (biz) => {
        const reviews = await Review.find({ businessId: biz._id });
        const count = reviews.length;
        const avg = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
        return {
          ...biz.toObject(),
          rating: parseFloat(avg.toFixed(1)),
          ratingCount: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: businessesWithRatings.length,
      businesses: businessesWithRatings,
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getBusinessesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const businesses = await Business.find({
      category: categoryId,
      status: true,
    })
      .populate("category")
      .populate("subcategories")
      .sort({ isPaid: -1, paidAmount: -1, createdAt: -1 });

    // Attach Ratings
    const businessesWithRatings = await Promise.all(
      businesses.map(async (biz) => {
        const reviews = await Review.find({ businessId: biz._id });
        const count = reviews.length;
        const avg = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
        return {
          ...biz.toObject(),
          rating: parseFloat(avg.toFixed(1)),
          ratingCount: count,
        };
      })
    );

    res.status(200).json({ businesses: businessesWithRatings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};