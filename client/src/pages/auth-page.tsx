import React from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertUserSchema } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlayer } from '@/contexts/PlayerContext';
import { apiRequest } from '@/lib/queryClient';

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { player, setPlayer } = usePlayer();
  const [isLoading, setIsLoading] = React.useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (player.isLoggedIn) {
      setLocation('/');
    }
  }, [player.isLoggedIn, setLocation]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      balance: 5000, // Default starting balance
    },
  });

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Current API paths in routes.ts are just /api/auth/login without the /api prefix
      const response = await apiRequest('POST', '/api/auth/login', data);
      const user = await response.json();
      setPlayer({
        id: user.id,
        username: user.username,
        balance: user.balance,
        isLoggedIn: true
      });
      toast({
        title: "Welcome back!",
        description: `You've successfully logged in as ${user.username}.`,
      });
      setLocation('/');
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Remove confirmPassword as it's not part of the API schema
      const { confirmPassword, ...registerData } = data;
      
      const response = await apiRequest('POST', '/api/auth/register', registerData);
      const user = await response.json();
      setPlayer({
        id: user.id,
        username: user.username,
        balance: user.balance,
        isLoggedIn: true
      });
      toast({
        title: "Account created!",
        description: `Welcome to the casino, ${user.username}!`,
      });
      setLocation('/');
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Auth Forms */}
        <div className="w-full md:w-1/2 bg-[#331D5C] p-6 rounded-xl shadow-xl">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <h2 className="text-2xl font-bold text-[#F8BF0C] mb-6">Welcome Back!</h2>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full bg-gradient-to-r from-[#F8BF0C] to-yellow-600 text-[#232131] font-bold" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register">
              <h2 className="text-2xl font-bold text-[#F8BF0C] mb-6">Create an Account</h2>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full bg-gradient-to-r from-[#F8BF0C] to-yellow-600 text-[#232131] font-bold" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Register"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Hero Section */}
        <div className="w-full md:w-1/2 text-center md:text-left">
          <div className="bg-gradient-to-r from-purple-700 to-pink-500 bg-clip-text text-transparent">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Royal Flush Casino</h1>
            <p className="text-2xl mb-6">Experience the thrill of winning!</p>
          </div>
          
          <div className="text-gray-300 space-y-4">
            <p className="text-lg">Join thousands of players and enjoy the best casino games online.</p>
            
            <div className="bg-black bg-opacity-30 p-4 rounded-lg">
              <h3 className="text-xl text-[#F8BF0C] font-semibold mb-2">Casino Features:</h3>
              <ul className="grid grid-cols-2 gap-2">
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span> Slot Machines
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span> Blackjack
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span> Poker Tables
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span> Dice Games
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span> Craps
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span> Virtual Rewards
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}