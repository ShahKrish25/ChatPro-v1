import { useState } from "react";
import emailjs from "emailjs-com";

export default function Contact() {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "kvshah25092005@gmail.com", // Krish's email (receiver)
    u_email: "", // User's email (sender)
    message: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    emailjs.send(
      "service_c8k4vvq", // Replace with your EmailJS Service ID
      "template_tzjkije", // Replace with your EmailJS Template ID
      {
        name: formData.name,
        email: formData.email, // ✅ Ensures receiver email is included
        u_email: formData.u_email, // ✅ User's email
        message: formData.message
      },
      "svea4TicuBNxllkQ7" // Replace with your EmailJS Public Key
    )
    .then((response) => {
      console.log("Email sent successfully:", response);
      setSuccessMessage("Message sent successfully!");
      setFormData({ name: "", u_email: "", message: "", email: "kvshah25092005@gmail.com" }); // ✅ Keeps Krish's email
    })
    .catch((error) => {
      console.error("Error sending email:", error);
      setSuccessMessage("Failed to send message. Please try again.");
    })
    .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-900 shadow sm:rounded-lg animate-fade-in">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Contact Us</h1>
          {successMessage && (
            <p className="mb-4 text-sm font-medium text-green-500">{successMessage}</p>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 min-h-[35px] text-lg block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="u_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Email
              </label>
              <input
                type="email"
                id="u_email"
                value={formData.u_email}
                onChange={handleChange}
                required
                className="mt-1 min-h-[35px] text-lg block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
