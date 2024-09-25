const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { findByIdAndDelete } = require("../models/Course");

exports.createSubSection = async (req, res) => {
  try {
    const { sectionId, title, timeDuration, description } = req.body;

    const video = req.files.videoFile;

    if (!sectionId || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //upload video to cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    const subSectionDetails = await SubSection.create({
      title,
      description,
      timeDuration,
      videoUrl: uploadDetails.secure_url,
    });

    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      {
        $push: {
          subSection: subSectionDetails._id,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      succcess: true,
      message: "Sub Section Created Successfully",
      updatedSection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//HW: updateSubSection

exports.updateSubSection = async (req, res) => {
  try {
    const { subSectionId, title, timeDuration, description } = req.body;

    const video = req.files.videoFile;

    if (!subSectionId || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //upload video to cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    const subSectionDetails = await SubSection.findByIdAndUpdate(
      subSectionId,
      {
        title,
        description,
        timeDuration,
        videoUrl: uploadDetails.secure_url,
      },
      { new: true }
    );

    return res.status(200).json({
      succcess: true,
      message: "Sub Section Created Successfully",
      subSectionDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//HW:deleteSubSection

exports.deleteSubSection = async (req, res) => {
  try {
    const { sectionID, subSectionID } = req.body;

    if ((!subSectionID, !sectionID)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    await SubSection.findByIdAndDelete({ _id: subSectionID });

    await Section.findByIdAndUpdate(
      sectionID,
      {
        $pull: { subSection: subSectionID }, // Removes the specific sub-section
      },
      { new: true } // To return the updated document
    );

    return res.status(400).json({
      success: true,
      message: " Deleted succesfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
