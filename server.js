// server.js

import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { body, validationResult } from 'express-validator';
import sanitizeHtml from 'sanitize-html';

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();

// Configuration Constants
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware Configuration
app.use(cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.resolve('public')));

// Database Connection
let db;
(async () => {
    try {
        const client = await MongoClient.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        db = client.db();

        // Ensure Indexes
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('families').createIndex({ familyCode: 1 }, { unique: true });
        await db.collection('families').createIndex({ createdBy: 1 });
        await db.collection('preferences').createIndex({ userId: 1, createdAt: -1 });
        await db.collection('faqs').createIndex({ question: 'text', answer: 'text' });
        await db.collection('meals').createIndex({ mealName: 'text' });

        console.log('Connected to MongoDB and indexes ensured');
    } catch (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
})();

// Helper Functions
const sanitizeInput = (input) => sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
const generateFamilyCode = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// Authentication Middleware
const authenticate = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(403).json({ error: 'Unauthorized: No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.collection('users').findOne({ email: decoded.email });
        if (!user) throw new Error('User not found');
        req.user = user;
        next();
    } catch {
        res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
};

// Family Setup Middleware
const verifyFamilySetup = (req, res, next) => {
    if (req.user.profileSetup) return next();
    res.status(403).json({ error: 'Family setup required' });
};

// Centralized Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Routes

// Serve Main and Authentication Pages
app.get('/', (req, res) => res.sendFile('index.html', { root: path.resolve('public') }));
app.get('/auth/login', (req, res) => res.sendFile('login.html', { root: path.resolve('public/auth') }));
app.get('/auth/signup', (req, res) => res.sendFile('signup.html', { root: path.resolve('public/auth') }));

// Serve Protected Dashboard Pages
app.get('/dashboard/family-setup.html', (req, res) => res.sendFile('family-setup.html', { root: path.resolve('public/dashboard') }));
app.get('/dashboard', authenticate, verifyFamilySetup, (req, res) => res.sendFile('dashboard.html', { root: path.resolve('public/dashboard') }));
app.get('/dashboard/food', authenticate, verifyFamilySetup, (req, res) => res.sendFile('food.html', { root: path.resolve('public/dashboard') }));
app.get('/dashboard/create-family', authenticate, verifyFamilySetup, (req, res) => res.sendFile('create-family.html', { root: path.resolve('public/dashboard') }));
app.get('/dashboard/join-family', authenticate, verifyFamilySetup, (req, res) => res.sendFile('join-family.html', { root: path.resolve('public/dashboard') }));

// API Endpoints

// User Signup
app.post('/api/signup',
    [
        body('name').trim().notEmpty().withMessage('Name is required').escape(),
        body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            let { name, email, password } = req.body;
            name = sanitizeInput(name);
            email = sanitizeInput(email);
            password = sanitizeInput(password);

            const existingUser = await db.collection('users').findOne({ email });
            if (existingUser) return res.status(409).json({ error: 'User already exists with this email' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await db.collection('users').insertOne({
                name,
                email,
                password: hashedPassword,
                profileSetup: false,
                createdAt: new Date(),
                emailNotifications: false,
                smsNotifications: false,
                pushNotifications: false,
            });

            const token = generateToken({ email });
            res.cookie('token', token, {
                httpOnly: true,
                secure: NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000,
            });

            res.status(201).json({ message: 'User created successfully', id: result.insertedId });
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ error: 'Failed to sign up' });
        }
    }
);

// User Login
app.post('/api/login',
    [
        body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            let { email, password } = req.body;
            email = sanitizeInput(email);
            password = sanitizeInput(password);

            const user = await db.collection('users').findOne({ email });
            if (!user) return res.status(403).json({ error: 'Invalid email or password' });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(403).json({ error: 'Invalid email or password' });

            const token = generateToken({ email: user.email });
            res.cookie('token', token, {
                httpOnly: true,
                secure: NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000,
            });

            res.status(200).json({ message: 'Login successful' });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Failed to log in' });
        }
    }
);

// Validate Family Code
app.post('/api/validate-family-code',
    [
        body('familyCode').trim().notEmpty().withMessage('Family code is required').escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            let { familyCode } = req.body;
            familyCode = sanitizeInput(familyCode);

            const family = await db.collection('families').findOne({ familyCode });
            if (!family) return res.status(404).json({ error: 'Invalid family code' });

            res.status(200).json({ message: 'Family code is valid' });
        } catch (error) {
            console.error('Validate family code error:', error);
            res.status(500).json({ error: 'Failed to validate family code' });
        }
    }
);

// Create Family
app.post('/api/create-family',
    authenticate,
    [
        body('familyName').trim().notEmpty().withMessage('Family name is required').escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            let { familyName } = req.body;
            familyName = sanitizeInput(familyName);

            let familyCode;
            do {
                familyCode = generateFamilyCode();
            } while (await db.collection('families').findOne({ familyCode }));

            const familyDoc = {
                familyName,
                familyCode,
                createdBy: ObjectId(req.user._id),
                familyMembers: [{
                    userId: ObjectId(req.user._id),
                    name: req.user.name,
                    relation: 'Self',
                    favoriteFoods: [],
                    joinedAt: new Date(),
                }],
                createdAt: new Date(),
            };

            await db.collection('families').insertOne(familyDoc);

            await db.collection('users').updateOne(
                { _id: ObjectId(req.user._id) },
                { $set: { familyCode, profileSetup: true } }
            );

            res.status(201).json({ message: 'Family created successfully', familyCode });
        } catch (error) {
            console.error('Create family error:', error);
            res.status(500).json({ error: 'Failed to create family' });
        }
    }
);

// Join Family
app.post('/api/join-family',
    authenticate,
    [
        body('familyCode').trim().notEmpty().withMessage('Family code is required').escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            let { familyCode } = req.body;
            familyCode = sanitizeInput(familyCode);

            const family = await db.collection('families').findOne({ familyCode });
            if (!family) return res.status(404).json({ error: 'Invalid family code' });

            // Check if user is already in the family
            const alreadyMember = family.familyMembers.some(member => member.userId.equals(req.user._id));
            if (alreadyMember) return res.status(400).json({ error: 'User is already a member of this family' });

            await db.collection('families').updateOne(
                { familyCode },
                { $push: { familyMembers: { userId: ObjectId(req.user._id), name: req.user.name, relation: 'Self', favoriteFoods: [], joinedAt: new Date() } } }
            );

            await db.collection('users').updateOne(
                { _id: ObjectId(req.user._id) },
                { $set: { familyCode, profileSetup: true } }
            );

            res.status(200).json({ message: 'Successfully joined the family' });
        } catch (error) {
            console.error('Join family error:', error);
            res.status(500).json({ error: 'Failed to join family' });
        }
    }
);

// Save Food Preferences
app.post('/api/food-preferences',
    authenticate,
    verifyFamilySetup,
    [
        body('age').isIn(['Barn (0-12 år)', 'Teenager (13-19 år)', 'Voksen (20-64 år)', 'Ældre (65+ år)']).withMessage('Invalid age group.'),
        body('gender').isIn(['Mand', 'Kvinde', 'Andet']).withMessage('Invalid gender selected.'),
        body('dietPreferences').isArray({ min: 1 }).withMessage('At least one diet preference must be selected.'),
        body('dietPreferences.*').isIn(['Vegan', 'Vegetar', 'Glutenfri', 'Lavkarbo', 'Andet']).withMessage('Invalid diet preference selected.'),
        body('otherDiet').optional().trim().escape(),
        body('dislikedFoods').trim().notEmpty().withMessage('Disliked foods are required.').escape(),
        body('proteinPreference').isIn(['Kylling', 'Oksekød', 'Fisk', 'Vegetarisk']).withMessage('Invalid protein preference selected.'),
        body('favoriteVeggies').trim().notEmpty().withMessage('Favorite veggies are required.').escape(),
        body('happyFoodType').isIn(['Italiensk', 'Mexicansk', 'Asiatisk', 'Dansk mad', 'Amerikansk', 'Andet']).withMessage('Invalid happy food type selected.'),
        body('otherHappyFood').optional().trim().escape(),
        body('flavorPreferences').isArray({ min: 1 }).withMessage('At least one flavor preference must be selected.'),
        body('flavorPreferences.*').isIn(['Krydret', 'Frisk', 'Sødt', 'Saltet', 'Cremet', 'Mildt', 'Balanceret', 'Andet']).withMessage('Invalid flavor preference selected.'),
        body('otherFlavor').optional().trim().escape(),
        body('specialDayDish').trim().notEmpty().withMessage('Special dish is required.').escape(),
        body('desiredDishes').trim().notEmpty().withMessage('Desired dishes are required.').escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            let {
                age, gender, dietPreferences, otherDiet, dislikedFoods,
                proteinPreference, favoriteVeggies, happyFoodType, otherHappyFood,
                flavorPreferences, otherFlavor, specialDayDish, desiredDishes
            } = req.body;

            if (dietPreferences.includes('Andet') && otherDiet) {
                dietPreferences = dietPreferences.filter(pref => pref !== 'Andet').concat(otherDiet);
            }

            if (happyFoodType === 'Andet' && otherHappyFood) {
                happyFoodType = otherHappyFood;
            }

            if (flavorPreferences.includes('Andet') && otherFlavor) {
                flavorPreferences = flavorPreferences.filter(pref => pref !== 'Andet').concat(otherFlavor);
            }

            const preferenceDoc = {
                userId: ObjectId(req.user._id),
                familyCode: req.user.familyCode,
                preferences: {
                    age, gender, dietPreferences, dislikedFoods,
                    proteinPreference, favoriteVeggies, happyFoodType,
                    flavorPreferences, specialDayDish, desiredDishes
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await db.collection('preferences').insertOne(preferenceDoc);
            res.status(201).json({ message: 'Food preferences saved successfully.' });
        } catch (error) {
            console.error('Save food preferences error:', error);
            res.status(500).json({ error: 'Failed to save food preferences.' });
        }
    }
);

// Get User's Food Preferences
app.get('/api/food-preferences',
    authenticate,
    async (req, res) => {
        try {
            const preferences = await db.collection('preferences')
                .find({ userId: ObjectId(req.user._id) })
                .sort({ createdAt: -1 })
                .toArray();
            res.status(200).json({ preferences });
        } catch (error) {
            console.error('Get food preferences error:', error);
            res.status(500).json({ error: 'Failed to fetch food preferences.' });
        }
    }
);

// Family Information
app.get('/api/family-info',
    authenticate,
    verifyFamilySetup,
    async (req, res) => {
        try {
            const family = await db.collection('families').findOne({ familyCode: req.user.familyCode });
            if (!family) return res.status(404).json({ error: 'Family not found.' });
            res.status(200).json({ familyName: family.familyName });
        } catch (error) {
            console.error('Get family info error:', error);
            res.status(500).json({ error: 'Failed to fetch family info.' });
        }
    }
);

// Today's Meal
app.get('/api/todays-meal',
    authenticate,
    verifyFamilySetup,
    async (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            // Assuming each family has one meal per day
            const meal = await db.collection('meals').findOne({ familyCode: req.user.familyCode, date: today });
            if (meal) {
                res.status(200).json(meal);
            } else {
                // If no meal is set for today, create a default or random meal
                const defaultMeals = [
                    { mealName: 'Grillet Kyllingesalat', calories: 350, imageUrl: 'https://source.unsplash.com/300x200/?healthy,meal' },
                    { mealName: 'Vegetarisk Buddha Bowl', calories: 400, imageUrl: 'https://source.unsplash.com/300x200/?vegetarian,meal' },
                    { mealName: 'Laks med Quinoa', calories: 500, imageUrl: 'https://source.unsplash.com/300x200/?salmon,meal' },
                    { mealName: 'Oksekødsgryde', calories: 600, imageUrl: 'https://source.unsplash.com/300x200/?beef,meal' }
                ];
                const todaysMeal = defaultMeals[Math.floor(Math.random() * defaultMeals.length)];
                const newMeal = { ...todaysMeal, familyCode: req.user.familyCode, date: today };
                await db.collection('meals').insertOne(newMeal);
                res.status(200).json(newMeal);
            }
        } catch (error) {
            console.error('Get today\'s meal error:', error);
            res.status(500).json({ error: 'Failed to fetch today\'s meal.' });
        }
    }
);

// Search Meals
app.get('/api/search-meals',
    authenticate,
    verifyFamilySetup,
    async (req, res) => {
        try {
            const query = req.query.q;
            if (!query || !query.trim()) return res.status(400).json({ error: 'Search query is required.' });

            const meals = await db.collection('meals').find(
                { 
                    familyCode: req.user.familyCode,
                    $text: { $search: query } 
                },
                { score: { $meta: "textScore" } }
            ).sort({ score: { $meta: "textScore" } }).limit(10).toArray();

            res.status(200).json({ meals });
        } catch (error) {
            console.error('Search meals error:', error);
            res.status(500).json({ error: 'Failed to search meals.' });
        }
    }
);

// Contact Form Submission
app.post('/api/contact',
    authenticate,
    [
        body('name').trim().notEmpty().withMessage('Name is required').escape(),
        body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
        body('message').trim().notEmpty().withMessage('Message is required').escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { name, email, message } = req.body;
            console.log(`Contact Form Submission:
Name: ${name}
Email: ${email}
Message: ${message}
            `);
            // Integrate with an email service here if needed
            res.status(200).json({ message: 'Your message has been received. We will get back to you shortly.' });
        } catch (error) {
            console.error('Contact form error:', error);
            res.status(500).json({ error: 'Failed to submit contact form.' });
        }
    }
);

// Add Family Member
app.post('/api/add-family-member',
    authenticate,
    verifyFamilySetup,
    [
        body('name').trim().notEmpty().withMessage('Name is required').escape(),
        body('relation').trim().notEmpty().withMessage('Relation is required').escape(),
        body('favoriteFoods').isArray({ min: 1 }).withMessage('At least one favorite food is required.'),
        body('favoriteFoods.*').trim().notEmpty().withMessage('Favorite food cannot be empty').escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { name, relation, favoriteFoods } = req.body;
            const familyCode = req.user.familyCode;

            // Check if the user exists
            const existingUser = await db.collection('users').findOne({ name });
            if (!existingUser) return res.status(404).json({ error: 'User not found to add as family member.' });

            // Avoid duplicate family members
            const family = await db.collection('families').findOne({ familyCode, 'familyMembers.userId': existingUser._id });
            if (family) return res.status(400).json({ error: 'User is already a family member.' });

            await db.collection('families').updateOne(
                { familyCode },
                { $push: { familyMembers: { userId: ObjectId(existingUser._id), name, relation, favoriteFoods, joinedAt: new Date() } } }
            );

            res.status(201).json({ message: 'Family member added successfully.' });
        } catch (error) {
            console.error('Add family member error:', error);
            res.status(500).json({ error: 'Failed to add family member.' });
        }
    }
);

// Get Family Members
app.get('/api/family-members',
    authenticate,
    verifyFamilySetup,
    async (req, res) => {
        try {
            const family = await db.collection('families').findOne({ familyCode: req.user.familyCode });
            if (!family) return res.status(404).json({ error: 'Family not found.' });

            // Populate member details from users collection
            const members = await Promise.all(family.familyMembers.map(async (member) => {
                const user = await db.collection('users').findOne({ _id: member.userId }, { projection: { password: 0 } });
                return {
                    userId: member.userId,
                    name: member.name,
                    relation: member.relation,
                    favoriteFoods: member.favoriteFoods,
                    joinedAt: member.joinedAt,
                    avatarUrl: user?.avatarUrl || 'https://via.placeholder.com/100', // Assuming avatarUrl exists
                };
            }));

            res.status(200).json({ members });
        } catch (error) {
            console.error('Get family members error:', error);
            res.status(500).json({ error: 'Failed to fetch family members.' });
        }
    }
);

// FAQs
app.get('/api/faqs',
    authenticate,
    async (req, res) => {
        try {
            const faqs = await db.collection('faqs').find({}).toArray();
            res.status(200).json({ faqs });
        } catch (error) {
            console.error('Get FAQs error:', error);
            res.status(500).json({ error: 'Failed to fetch FAQs.' });
        }
    }
);

// Create FAQ (Optional: Admin Only)
app.post('/api/faqs',
    authenticate,
    [
        body('question').trim().notEmpty().withMessage('Question is required').escape(),
        body('answer').trim().notEmpty().withMessage('Answer is required').escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { question, answer } = req.body;

            // Optional: Check for admin privileges
            // if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden: Admins only.' });

            await db.collection('faqs').insertOne({ question, answer, createdAt: new Date() });
            res.status(201).json({ message: 'FAQ added successfully.' });
        } catch (error) {
            console.error('Add FAQ error:', error);
            res.status(500).json({ error: 'Failed to add FAQ.' });
        }
    }
);

// Get User Settings
app.get('/api/user-settings',
    authenticate,
    async (req, res) => {
        try {
            const user = await db.collection('users').findOne({ _id: ObjectId(req.user._id) }, { projection: { password: 0 } });
            if (!user) return res.status(404).json({ error: 'User not found.' });

            const profile = { username: user.name, email: user.email };
            const notifications = { 
                email: user.emailNotifications || false, 
                sms: user.smsNotifications || false, 
                push: user.pushNotifications || false 
            };
            res.status(200).json({ profile, notifications });
        } catch (error) {
            console.error('Get user settings error:', error);
            res.status(500).json({ error: 'Failed to fetch user settings.' });
        }
    }
);

// Update Profile
app.put('/api/update-profile',
    authenticate,
    [
        body('username').trim().notEmpty().withMessage('Username is required').escape(),
        body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
        body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { username, email, password } = req.body;
            const sanitizedUsername = sanitizeInput(username);
            const sanitizedEmail = sanitizeInput(email);

            if (email !== req.user.email) {
                const existingUser = await db.collection('users').findOne({ email });
                if (existingUser) return res.status(409).json({ error: 'Email is already in use by another account.' });
            }

            const updateFields = { name: sanitizedUsername, email: sanitizedEmail };
            if (password) updateFields.password = await bcrypt.hash(sanitizeInput(password), 10);

            await db.collection('users').updateOne({ _id: ObjectId(req.user._id) }, { $set: updateFields });
            res.status(200).json({ message: 'Profile updated successfully.' });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile.' });
        }
    }
);

// Update Notifications
app.put('/api/update-notifications',
    authenticate,
    [
        body('email').isBoolean().withMessage('Email notification must be a boolean.'),
        body('sms').isBoolean().withMessage('SMS notification must be a boolean.'),
        body('push').isBoolean().withMessage('Push notification must be a boolean.'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { email, sms, push } = req.body;
            await db.collection('users').updateOne(
                { _id: ObjectId(req.user._id) },
                { $set: { emailNotifications: email, smsNotifications: sms, pushNotifications: push } }
            );
            res.status(200).json({ message: 'Notification preferences updated successfully.' });
        } catch (error) {
            console.error('Update notifications error:', error);
            res.status(500).json({ error: 'Failed to update notifications.' });
        }
    }
);

// Get FAQs
app.get('/api/faqs',
    authenticate,
    async (req, res) => {
        try {
            const faqs = await db.collection('faqs').find({}).toArray();
            res.status(200).json({ faqs });
        } catch (error) {
            console.error('Get FAQs error:', error);
            res.status(500).json({ error: 'Failed to fetch FAQs.' });
        }
    }
);

// Handle Undefined Routes
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));