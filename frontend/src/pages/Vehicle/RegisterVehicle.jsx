import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const RegisterVehicle = () => {
  const [formData, setFormData] = useState({
    type: '',
    plateNumber: '',
    ownerOfVehicle: '',
    color: '',
    carPicture: '',
    displayPicture: '',
    carDocument: '',
  });
  const [loading, setLoading] = useState(false); 
  const token = localStorage.getItem('token');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const uploadToCloudinary = async (file) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      setLoading(true); // Start loading
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        uploadData
      );
      return response.data.secure_url;
    } catch (error) {
      toast.error('Failed to upload file', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      throw error;
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      const url = await uploadToCloudinary(files[0]);
      setFormData((prev) => ({ ...prev, [name]: url }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/rentals/vehicles`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Vehicle registered successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setFormData({
        type: '',
        plateNumber: '',
        ownerOfVehicle: '',
        color: '',
        carPicture: '',
        displayPicture: '',
        carDocument: '',
      });
    } catch (error) {
      toast.error(error.response?.data.error || 'Failed to register vehicle', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Register Vehicle</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Vehicle Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border rounded mt-1"
            disabled={loading}
          >
            <option value="">Select Type</option>
            <option value="bus">Bus</option>
            <option value="van">Van</option>
            <option value="lorry">Lorry</option>
            <option value="trailer">Trailer</option>
          </select>
        </div>

        <div>
          <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700">Plate Number</label>
          <input
            id="plateNumber"
            name="plateNumber"
            value={formData.plateNumber}
            onChange={handleChange}
            placeholder="Plate Number"
            className="w-full p-2 border rounded mt-1"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="ownerOfVehicle" className="block text-sm font-medium text-gray-700">Owner Name</label>
          <input
            id="ownerOfVehicle"
            name="ownerOfVehicle"
            value={formData.ownerOfVehicle}
            onChange={handleChange}
            placeholder="Owner Name"
            className="w-full p-2 border rounded mt-1"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700">Color</label>
          <input
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="Color"
            className="w-full p-2 border rounded mt-1"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="carPicture" className="block text-sm font-medium text-gray-700">Car Picture</label>
          <input
            id="carPicture"
            type="file"
            name="carPicture"
            onChange={handleFileChange}
            className="w-full p-2 mt-1"
            disabled={loading}
          />
          {formData.carPicture && (
            <img src={formData.carPicture} alt="Car Preview" className="w-20 h-20 object-cover mt-2" />
          )}
        </div>

        <div>
          <label htmlFor="displayPicture" className="block text-sm font-medium text-gray-700">Display Picture</label>
          <input
            id="displayPicture"
            type="file"
            name="displayPicture"
            onChange={handleFileChange}
            className="w-full p-2 mt-1"
            disabled={loading}
          />
          {formData.displayPicture && (
            <img src={formData.displayPicture} alt="Display Preview" className="w-20 h-20 object-cover mt-2" />
          )}
        </div>

        <div>
          <label htmlFor="carDocument" className="block text-sm font-medium text-gray-700">Car Document</label>
          <input
            id="car_DOCUMENT"
            type="file"
            name="carDocument"
            onChange={handleFileChange}
            className="w-full p-2 mt-1"
            disabled={loading}
          />
          {formData.carDocument && (
            <img src={formData.carDocument} alt="Document Preview" className="w-20 h-20 object-cover mt-2" />
          )}
        </div>

        <button
          type="submit"
          className={`w-full bg-customPink text-white p-2 rounded flex items-center justify-center ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
          }`}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Registering...
            </>
          ) : (
            'Register'
          )}
        </button>
      </form>
    </div>
  );
};

export default RegisterVehicle;