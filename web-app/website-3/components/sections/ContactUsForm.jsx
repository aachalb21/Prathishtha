"use client";
import React, { useState } from "react";
import ContactFormAPI from "@/app/Service/Api/ContactFormAPI";

export default function ContactUsForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!name || !email || !subject || !message) {
      setStatus({ type: "error", message: "Please fill in all fields" });
      return;
    }

    setIsLoading(true);
    setStatus({ type: "", message: "" });

    const payload = { name, email, subject, message };
    const response = await ContactFormAPI.submitContactForm(payload);

    if (response.success) {
      setStatus({ type: "success", message: "Message sent successfully! We'll get back to you soon." });
      // Clear form
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } else {
      setStatus({ type: "error", message: response.message || "Failed to send message. Please try again." });
    }

    setIsLoading(false);
  };

  return (
    <div className="relative flex-1">
      {/* Tilted shadow background */}
      <div
        className="absolute inset-0 -z-10"
        style={{ transform: "rotate(-6deg) translate(-16px, 24px)" }}
      >
        <div className="w-full h-full bg-black opacity-80 rounded-none"></div>
      </div>
      <form
        className="bg-white border-[5px] border-black p-8 relative z-10"
        onSubmit={handleSubmit}
      >
        <div className="absolute -top-8 left-8 bg-[#ff3b3f] border-4 border-black rounded-full w-16 h-16 flex items-center justify-center text-white text-4xl shadow-lg comic-bubble">
          ✉️
        </div>
        <h3 className="font-happy-school text-3xl text-[#ff3b3f] mb-6 text-center">
          Send us a Message!
        </h3>
        
        {/* Status Message */}
        {status.message && (
          <div className={`mb-4 p-3 border-4 border-black font-comic text-center ${
            status.type === "success" 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            {status.message}
          </div>
        )}

        <div className="mb-4">
          <label
            className="block font-happy-school text-lg mb-2 text-[#222]"
            htmlFor="name"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="w-full px-4 py-2 border-4 border-black font-happy-school text-lg focus:outline-none focus:ring-2 focus:ring-[#ff3b3f] comic-input"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label
            className="block font-happy-school text-lg mb-2 text-[#222]"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full px-4 py-2 border-4 border-black font-happy-school text-lg focus:outline-none focus:ring-2 focus:ring-[#ff3b3f] comic-input"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label
            className="block font-happy-school text-lg mb-2 text-[#222]"
            htmlFor="subject"
          >
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            className="w-full px-4 py-2 border-4 border-black font-happy-school text-lg focus:outline-none focus:ring-2 focus:ring-[#ff3b3f] comic-input"
            placeholder="What's this about?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="mb-6">
          <label
            className="block font-happy-school text-lg mb-2 text-[#222]"
            htmlFor="message"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className="w-full px-4 py-2 border-4 border-black font-happy-school text-lg focus:outline-none focus:ring-2 focus:ring-[#ff3b3f] comic-input"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#ff3b3f] text-white font-happy-school text-2xl border-4 border-black py-2 shadow-[-6px_6px_0px_#000] hover:bg-[#ff5e5e] transition-colors comic-btn disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderRadius: 0 }}
        >
          {isLoading ? "Sending..." : "Send!"}
        </button>
      </form>
    </div>
  );
}
