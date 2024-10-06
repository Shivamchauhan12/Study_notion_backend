const Course = require("../models/Course");
const Category = require("../models/Category");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const User=require("../models/User")

exports.createCourse = async (req, res) => {
  try {
    let { courseName, price, tag, category,courseDescription, whatYouWillLearn,instructions,status} =
      req.body;

      console.log(req.files)

      const thumbnail = req.files.thumbnailImage;
console.log('====',thumbnail)
    //validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag ||
      !thumbnail
      ||!category
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    if (!status || status === undefined) {
			status = "Draft";
		}

    //check for instructor
    const userId = req.user.id;
    const instructorDetails = await User.findById(userId,{accountType: "Instructor"});
    console.log("Instructor Details: ", instructorDetails);
    //TODO: Verify that userId and instructorDetails._id  are same or different ?

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor Details not found",
      });
    }

  

    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: "categoryDetails Details not found",
      });
    }

    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );

    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn: whatYouWillLearn,
      price,
      category: categoryDetails._id,
      thumbnail: thumbnailImage.secure_url,
      status: status,
			instructions: instructions,
    });

    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );
    await Category.findByIdAndUpdate(
			{ _id: category },
			{
				$push: {
					course: newCourse._id,
				},
			},
			{ new: true }
		);
    

    return res.status(200).json({
      success: true,
      message: "Course Created Successfully",
      data: newCourse,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Course",
      error: error.message,
    });
  }
};

//getAllCourses handler function

exports.showAllCourses = async (req, res) => {
  try {
    //TODO: change the below statement incrementally
    const allCourses = await Course.find({},{
      courseName: true,
      price: true,
      thumbnail: true,
      instructor: true,
      ratingAndReviews: true,
      studentsEnroled: true,
    }).populate("instructor").exec();

    return res.status(200).json({
      success: true,
      message: "Data for all courses fetched successfully",
      data: allCourses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot Fetch course data",
      error: error.message,
    });
  }
};

//getCourseDetails
exports.getCourseDetails = async (req, res) => {
    try {
            //get id
            const {courseId} = req.body;
            //find course details
            const courseDetails = await Course.find(
                                        {_id:courseId})
                                        .populate(
                                            {
                                                path:"instructor",
                                                populate:{
                                                    path:"additionalDetails",
                                                },
                                            }
                                        )
                                        .populate("category")
                                        //.populate("ratingAndreviews")
                                        .populate({
                                            path:"courseContent",
                                            populate:{
                                                path:"subSection",
                                            },
                                        })
                                        .exec();

                //validation
                if(!courseDetails) {
                    return res.status(400).json({
                        success:false,
                        message:`Could not find the course with ${courseId}`,
                    });
                }
                //return response
                return res.status(200).json({
                    success:true,
                    message:"Course Details fetched successfully",
                    data:courseDetails,
                })

    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}
