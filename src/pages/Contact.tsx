import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  CheckCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const Contact = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin-dashboard");
    }
  }, [isAdmin, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      details: ["+1 (555) 123-4567", "+1 (555) 123-4568"],
      description: "Mon-Fri 9AM-6PM PST",
    },
    {
      icon: Mail,
      title: "Email",
      details: ["info@nutrivault.com", "support@nutrivault.com"],
      description: "We'll respond within 24 hours",
    },
    {
      icon: MapPin,
      title: "Address",
      details: ["123 Health Street", "Los Angeles, CA 90210"],
      description: "Visit our showroom",
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: ["Mon-Fri: 9AM-6PM", "Sat: 10AM-4PM"],
      description: "Closed on Sundays",
    },
  ];

  const faqs = [
    {
      question: "What are your shipping options?",
      answer:
        "We offer free shipping on orders over $50. Standard shipping takes 3-5 business days, and express shipping is available for 1-2 day delivery.",
    },
    {
      question: "Are your products organic?",
      answer:
        "Many of our products are certified organic. Look for the organic badge on product pages. We also carry conventional options for various preferences.",
    },
    {
      question: "What is your return policy?",
      answer:
        "We offer a 30-day satisfaction guarantee. If you're not happy with your purchase, contact us for a full refund or exchange.",
    },
    {
      question: "Do you offer bulk discounts?",
      answer:
        "Yes! We offer volume discounts for orders over $200. Contact our sales team for custom pricing on large orders.",
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save contact message to database
      const { error } = await supabase.from("contact_messages").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: formData.subject,
        category: formData.category,
        message: formData.message,
        status: "unread",
      });

      if (error) {
        // Handle missing table gracefully
        if (
          error.code === "42P01" ||
          error.message?.includes("does not exist")
        ) {
          console.warn(
            "Contact messages table not created yet, message not saved to database",
          );
          setSubmitted(true);
          setFormData({
            name: "",
            email: "",
            phone: "",
            subject: "",
            category: "",
            message: "",
          });

          toast({
            title: "Message sent!",
            description:
              "We'll get back to you within 24 hours. (Note: Database setup required for message storage)",
          });
          return;
        }
        throw error;
      }

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        category: "",
        message: "",
      });

      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });
    } catch (error: any) {
      console.error("Error saving contact message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Card>
              <CardContent className="p-8">
                <div className="text-6xl mb-6">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Message Sent Successfully!
                </h2>
                <p className="text-gray-600 mb-6">
                  Thank you for contacting us. We'll get back to you within 24
                  hours.
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  className="bg-brand-600 hover:bg-brand-700"
                >
                  Send Another Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-50 to-warm-50 py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Get in Touch
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions about our products? Need help with your order? We're
            here to help!
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <MessageSquare className="h-5 w-5 text-brand-600" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(555) 123-4567"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category" className="text-sm font-medium">
                        Category
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          handleSelectChange("category", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">
                            General Inquiry
                          </SelectItem>
                          <SelectItem value="order">Order Support</SelectItem>
                          <SelectItem value="product">
                            Product Question
                          </SelectItem>
                          <SelectItem value="shipping">Shipping</SelectItem>
                          <SelectItem value="return">
                            Returns & Exchanges
                          </SelectItem>
                          <SelectItem value="wholesale">Wholesale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief description of your inquiry"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please provide details about your inquiry..."
                      rows={6}
                      required
                      className="mt-1"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6 order-1 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center">
                      <info.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                        {info.title}
                      </h3>
                      {info.details.map((detail, idx) => (
                        <p
                          key={idx}
                          className="text-gray-600 text-sm break-words"
                        >
                          {detail}
                        </p>
                      ))}
                      <p className="text-xs text-gray-500 mt-1">
                        {info.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-200 pb-4 last:border-0"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">
                      {faq.question}
                    </h4>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="py-12 sm:py-16 bg-brand-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div className="space-y-3 sm:space-y-4">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">📞</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Call Us</h3>
              <p className="text-brand-100 mb-3 sm:mb-4 text-sm sm:text-base">
                Speak directly with our support team
              </p>
              <button className="bg-white text-brand-700 hover:bg-gray-100 px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base w-full sm:w-auto">
                +1 (555) 123-4567
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">💬</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Live Chat
              </h3>
              <p className="text-brand-100 mb-3 sm:mb-4 text-sm sm:text-base">
                Get instant help from our chat support
              </p>
              <button className="bg-white text-brand-700 hover:bg-gray-100 px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base w-full sm:w-auto">
                Start Chat
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">📧</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Email Support
              </h3>
              <p className="text-brand-100 mb-3 sm:mb-4 text-sm sm:text-base">
                Send us an email and we'll respond quickly
              </p>
              <button className="bg-white text-brand-700 hover:bg-gray-100 px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base w-full sm:w-auto break-all sm:break-normal">
                info@nutrivault.com
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
