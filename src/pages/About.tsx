import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Leaf,
  Shield,
  Award,
  Truck,
  Users,
  Globe,
  Star,
} from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Leaf,
      title: "Natural & Organic",
      description:
        "We source only the finest organic nuts and dried fruits from certified farms around the world.",
    },
    {
      icon: Shield,
      title: "Quality Guaranteed",
      description:
        "Every product undergoes rigorous quality testing to ensure freshness and nutritional value.",
    },
    {
      icon: Heart,
      title: "Health First",
      description:
        "Our mission is to promote healthy living through premium, nutrient-rich natural products.",
    },
    {
      icon: Truck,
      title: "Fresh Delivery",
      description:
        "Fast, reliable shipping ensures your products arrive fresh and ready to enjoy.",
    },
  ];

  const stats = [
    { icon: Users, number: "10,000+", label: "Happy Customers" },
    { icon: Globe, number: "15+", label: "Countries Sourced" },
    { icon: Award, number: "50+", label: "Quality Certifications" },
    { icon: Star, number: "4.9/5", label: "Customer Rating" },
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      description:
        "Nutritionist with 15+ years of experience in healthy food sourcing.",
      image: "👩‍💼",
    },
    {
      name: "Michael Chen",
      role: "Head of Quality",
      description:
        "Food scientist ensuring every product meets our high standards.",
      image: "👨‍🔬",
    },
    {
      name: "Emily Rodriguez",
      role: "Sourcing Director",
      description:
        "Building relationships with premium farms and suppliers worldwide.",
      image: "👩‍🌾",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-50 to-warm-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="bg-brand-100 text-brand-700 mb-6">
              About NutriVault
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Nourishing Lives with{" "}
              <span className="text-brand-600">Nature's Finest</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Since 2015, NutriVault has been your trusted partner in healthy
              living, sourcing the world's premium nuts, dried fruits, and
              natural snacks to support your wellness journey.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  NutriVault was born from a simple belief: everyone deserves
                  access to pure, nutritious, and delicious natural foods. Our
                  founder, Sarah Johnson, started this journey after struggling
                  to find high-quality nuts and dried fruits that met her
                  nutritionist standards.
                </p>
                <p>
                  What began as a small local business has grown into a trusted
                  brand serving thousands of health-conscious customers
                  worldwide. We've built lasting relationships with certified
                  organic farms and artisanal producers who share our commitment
                  to quality and sustainability.
                </p>
                <p>
                  Today, we're proud to offer over 100 premium products, each
                  carefully selected and rigorously tested to ensure maximum
                  nutritional value and exceptional taste.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">🌱</div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    2015 Founded
                  </h3>
                  <p className="text-sm text-gray-600">
                    Started with a mission to provide healthy snacks
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">🏆</div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Award Winning
                  </h3>
                  <p className="text-sm text-gray-600">
                    Recognized for quality and innovation
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">🌍</div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Global Sourcing
                  </h3>
                  <p className="text-sm text-gray-600">
                    Partners in 15+ countries worldwide
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">💚</div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Sustainable
                  </h3>
                  <p className="text-sm text-gray-600">
                    Committed to eco-friendly practices
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These core principles guide everything we do, from sourcing to
              delivery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 text-brand-600 rounded-full mb-6">
                    <value.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-brand-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-4">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold mb-1">{stat.number}</div>
                <div className="text-brand-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Passionate experts dedicated to bringing you the finest natural
              products
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="text-6xl mb-4">{member.image}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-brand-600 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Healthy Journey?
          </h2>
          <p className="text-brand-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust NutriVault for their
            premium nuts and dried fruits.
          </p>
          <div className="space-x-4">
            <button className="bg-white text-brand-700 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors">
              Shop Now
            </button>
            <button className="border border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
