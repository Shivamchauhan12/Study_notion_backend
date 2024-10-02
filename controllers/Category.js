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


exports.categoryPageDetails=async(req,res)=>{
  try {
    const {courseId}=req.body;

    const selectedCategory  = await Category.findById(_id=courseId).populate("courses").exec();

    if(!selectedCategory){
      return res.status(404).json({
        success:false,
        message:"not found corses"
      })
    }

    if(selectedCategory.courses.length === 0){
      console.log("No courses found for selected category")
      return res.status(404).json({
				success: false,
				message: "No courses found for the selected category.",
			});
    }


    const selectedCourses=selectedCategory.courses;

    const categoriesExceptSelected=await Category.find({_id:{$ne:courseId}}).populate("courses");

    let differentCourses=[];

    for(const category of categoriesExceptSelected){
      differentCourses.push(...category.courses)
    }


	// Get top-selling courses across all categories
		const allCategories = await Category.find().populate("courses");
		const allCourses = allCategories.flatMap((category) => category.courses);
		const mostSellingCourses = allCourses
			.sort((a, b) => b.sold - a.sold)
			.slice(0, 10);

		res.status(200).json({
			selectedCourses: selectedCourses,
			differentCourses: differentCourses,
			mostSellingCourses: mostSellingCourses,
		});
    
  } catch (error) {
    return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
  }

}
