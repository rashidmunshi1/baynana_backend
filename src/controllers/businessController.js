const Business = require("../models/Business");
const Review = require("../models/Review"); // Import Review Model

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

    // 2️⃣ PAID LOGIC
    let paidExpiry = null;
    if (isPaid && paidDays) {
      paidExpiry = new Date();
      paidExpiry.setDate(paidExpiry.getDate() + Number(paidDays));
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
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      description,
      services,
      socialLinks,
      timings: parsedTimings,
      images,
      isPaid,
      paidAmount,
      paidDays,
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
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      description,
      services,
      socialLinks,
      timings: parsedUpdateTimings
    };

    // New images uploaded?
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file) => file.filename);
    }

    // Update Paid Details
    if (isPaid !== undefined) {
      updateData.isPaid = isPaid;
      updateData.paidAmount = paidAmount;
      updateData.paidDays = paidDays;

      if (isPaid && paidDays) {
        let newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + Number(paidDays));
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
    const mobile = req.params.mobile;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const businesses = await Business.find({ mobile })
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

    const businesses = await Business.find({
      status: true, // only active businesses
      // isPaid: true, // REMOVED so unpaid also show up
      $or: [
        { businessName: { $regex: keyword, $options: "i" } },
        { city: { $regex: keyword, $options: "i" } },
        { address: { $regex: keyword, $options: "i" } },
        { services: { $regex: keyword, $options: "i" } },
      ],
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