export const uploadToCloudinary = async (file) => {
  if (!file) {
    console.error("No file provided for upload");
    throw new Error("No file provided");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "VehicalRent"); // Make sure it's correct and UNSIGNED
  formData.append("folder", "VehicleRent");

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/duuwjh5ep/image/upload", {
      method: "POST",
      body: formData,
    });

    const responseText = await res.text();
    console.log("Cloudinary raw response:", responseText);

    if (!res.ok) {
      throw new Error("Cloudinary upload failed");
    }

    const data = JSON.parse(responseText);
    return data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error.message);
    throw error;
  }
};
