const Category = require("../models/Category");

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      res.status(400).json({
        success: false,
        message: "All fiels required",
      });
    }

    const CategoryDetails = await Category.create({ name, description });

    console.log(CategoryDetails);
    //return response

    return res.status(200).json({
      success: true,
      message: "Category Created Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.showAllCategory = async (req, res) => {
  try {
    const allCategory = await Category.find({}, { name: true, description: true });

    res.status(200).json({
      success: true,
      message: "All Category returned successfully",
      allCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
