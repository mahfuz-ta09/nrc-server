import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
import authChecker from "../../helper/authChecker"
const { getDb } = require('../../config/connectDB')
import { format } from "date-fns";

interface AuthenticatedRequest extends Request {
    user?: any;
}

interface StudentProfile {
    educationLevel: string;
    gpa: number;
    gpaScale: string;
    englishProficiency: {
        testType: string;
        overallScore: number;
        listening?: number;
        reading?: number;
        writing?: number;
        speaking?: number;
    };
    previousSubjects: string[];
    preferredField: string;
    budget: number;
    age?: number;
}

interface MatchResult {
    subject: any;
    matchScore: number;
    matchReasons: string[];
}


const getCountries = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        await authChecker(req, res,["super_admin","admin","agent"]);
        const countries = await collection
            .find(
                { type: 'study-option', status: 'published' },
                { 
                    projection: { 
                        _id: 1, 
                        country: 1, 
                        slug: 1, 
                        currency: 1,
                        countryFlg: 1,
                        serial: 1
                    } 
                }
            )
            .sort({ serial: 1 })
            .toArray();

        res.status(200).json({
            success: true,
            message: 'Countries fetched successfully',
            data: countries
        });
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error
        });
    }
};


const getUniversitiesByCountry = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        const { countryId } = req.query;

        if (!countryId || typeof countryId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing country ID'
            });
        }

        const country = await collection.findOne(
            { _id: new ObjectId(countryId) },
            { projection: { universityList: 1, country: 1, currency: 1 } }
        );

        if (!country) {
            return res.status(404).json({
                success: false,
                message: 'Country not found'
            });
        }

        // Filter only active universities
        const activeUniversities = (country.universityList || []).filter(
            (uni: any) => uni.status === 'active'
        );

        res.status(200).json({
            success: true,
            message: 'Universities fetched successfully',
            data: {
                country: country.country,
                currency: country.currency,
                universityList: activeUniversities
            }
        });
    } catch (error) {
        console.error('Error fetching universities:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error
        });
    }
};



const matchSubjects = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        
        const { countryId, universityId, studentProfile } = req.body as {
            countryId: string;
            universityId: string;
            studentProfile: StudentProfile;
        };

        console.log(req.body)
        console.log(req.body.academicInfo)
        console.log(req.body.englishProficiency)

        // Validation
        if (!countryId || !universityId || !studentProfile) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters'
            });
        }

        // Fetch country and university data
        const country = await collection.findOne({
            _id: new ObjectId(countryId)
        });

        if (!country) {
            return res.status(404).json({
                success: false,
                message: 'Country not found'
            });
        }

        const university = country.universityList?.find(
            (uni: any) => uni.universityId === universityId
        );

        if (!university) {
            return res.status(404).json({
                success: false,
                message: 'University not found'
            });
        }

        if (!university.subjects || university.subjects.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No subjects available',
                data: { matchedSubjects: [] }
            });
        }

        // Match and score subjects
        const matchedSubjects = university.subjects
            .map((subject: any) => calculateMatch(subject, studentProfile, university))
            .filter((result: MatchResult) => result.matchScore >= 40) // Minimum 40% match
            .sort((a: MatchResult, b: MatchResult) => b.matchScore - a.matchScore);

        res.status(200).json({
            success: true,
            message: 'Subjects matched successfully',
            data: {
                matchedSubjects: matchedSubjects.map((result: MatchResult) => ({
                    ...result.subject,
                    matchScore: result.matchScore,
                    matchReasons: result.matchReasons
                })),
                totalMatches: matchedSubjects.length,
                universityName: university.universityName
            }
        });

    } catch (error) {
        console.error('Error matching subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error
        });
    }
};

// ============================================
// Matching Algorithm
// ============================================
function calculateMatch(
    subject: any, 
    profile: StudentProfile, 
    university: any
): MatchResult {
    let score = 0;
    const maxScore = 100;
    const reasons: string[] = [];

    // 1. Education Level Match (20 points)
    const educationLevelMatch = checkEducationLevel(
        profile.educationLevel, 
        subject.programLevel, 
        university.admissionRequirements?.requiredEducationLevel
    );
    score += educationLevelMatch.score;
    if (educationLevelMatch.reason) reasons.push(educationLevelMatch.reason);

    // 2. GPA Match (20 points)
    const gpaMatch = checkGPA(
        profile.gpa, 
        profile.gpaScale, 
        university.admissionRequirements?.minimumGPA
    );
    score += gpaMatch.score;
    if (gpaMatch.reason) reasons.push(gpaMatch.reason);

    // 3. English Proficiency Match (20 points)
    const englishMatch = checkEnglishProficiency(
        profile.englishProficiency, 
        university.englishProf
    );
    score += englishMatch.score;
    if (englishMatch.reason) reasons.push(englishMatch.reason);

    // 4. Budget Match (15 points)
    const budgetMatch = checkBudget(profile.budget, subject.cost);
    score += budgetMatch.score;
    if (budgetMatch.reason) reasons.push(budgetMatch.reason);

    // 5. Field/Faculty Match (15 points)
    const fieldMatch = checkFieldMatch(
        profile.preferredField, 
        subject.faculty, 
        subject.subjectName
    );
    score += fieldMatch.score;
    if (fieldMatch.reason) reasons.push(fieldMatch.reason);

    // 6. Prerequisites Match (10 points)
    const prereqMatch = checkPrerequisites(
        profile.previousSubjects, 
        university.admissionRequirements?.prerequisiteSubjects
    );
    score += prereqMatch.score;
    if (prereqMatch.reason) reasons.push(prereqMatch.reason);

    return {
        subject: {
            id: subject.id || subject._id,
            subjectName: subject.subjectName,
            programLevel: subject.programLevel,
            degree: subject.degree,
            duration: subject.duration,
            cost: subject.cost,
            intakes: subject.intakes,
            programType: subject.programType,
            faculty: subject.faculty,
            modeOfStudy: subject.modeOfStudy,
            qualifications: subject.qualifications,
            accreditation: subject.accreditation,
            description: subject.description,
            careerOpportunities: subject.careerOpportunities,
            applicationDeadline: subject.applicationDeadline,
            language: subject.language,
            credits: subject.credits,
            placement: subject.placement
        },
        matchScore: Math.round(score),
        matchReasons: reasons
    };
}

// ============================================
// Matching Helper Functions
// ============================================

function checkEducationLevel(
    studentLevel: string, 
    programLevel: string, 
    requiredLevel?: string
): { score: number; reason: string | null } {
    const levels: Record<string, number> = {
        'high_school': 1,
        'diploma': 2,
        'associate': 3,
        'bachelors': 4,
        'masters': 5,
        'doctorate': 6
    };

    const programLevelMap: Record<string, number> = {
        'Certificate': 2,
        'Diploma': 2,
        'Foundation': 2,
        'Associate Degree': 3,
        'Undergraduate': 4,
        'Graduate': 5,
        'Doctorate': 6
    };

    const studentLevelNum = levels[studentLevel.toLowerCase()] || 0;
    const programLevelNum = programLevelMap[programLevel] || 0;
    const requiredLevelNum = requiredLevel ? levels[requiredLevel.toLowerCase()] || 0 : 0;

    if (studentLevelNum >= Math.max(programLevelNum - 1, requiredLevelNum)) {
        return { 
            score: 20, 
            reason: 'Your education level matches the program requirements' 
        };
    } else if (studentLevelNum >= programLevelNum - 2) {
        return { 
            score: 10, 
            reason: 'You may need additional qualifications for this program' 
        };
    }
    
    return { score: 0, reason: null };
}

function checkGPA(
    studentGPA: number, 
    studentScale: string, 
    minimumGPA?: { value: number; scale: string }
): { score: number; reason: string | null } {
    if (!minimumGPA) {
        return { score: 20, reason: 'No specific GPA requirement' };
    }

    // Normalize to 4.0 scale
    const normalizeGPA = (gpa: number, scale: string): number => {
        const scaleNum = parseFloat(scale);
        return (gpa / scaleNum) * 4.0;
    };

    const normalizedStudentGPA = normalizeGPA(studentGPA, studentScale);
    const normalizedMinGPA = normalizeGPA(minimumGPA.value, minimumGPA.scale);

    if (normalizedStudentGPA >= normalizedMinGPA + 0.5) {
        return { 
            score: 20, 
            reason: `Your GPA (${studentGPA}) exceeds the minimum requirement` 
        };
    } else if (normalizedStudentGPA >= normalizedMinGPA) {
        return { 
            score: 15, 
            reason: `Your GPA (${studentGPA}) meets the minimum requirement` 
        };
    } else if (normalizedStudentGPA >= normalizedMinGPA - 0.3) {
        return { 
            score: 10, 
            reason: `Your GPA is slightly below requirement (may need other strong qualifications)` 
        };
    }
    
    return { score: 0, reason: null };
}

function checkEnglishProficiency(
    studentProf: StudentProfile['englishProficiency'], 
    universityProf?: any
): { score: number; reason: string | null } {
    if (!universityProf || !studentProf) {
        return { score: 20, reason: 'English proficiency not specified' };
    }

    const testType = studentProf.testType.toUpperCase();
    const requiredScores = universityProf[testType] || universityProf[studentProf.testType];

    if (!requiredScores) {
        return { score: 15, reason: 'Your English test is acceptable' };
    }

    let meetsRequirement = true;
    const sections = ['overall', 'listening', 'reading', 'writing', 'speaking'];
    
    for (const section of sections) {
        if (requiredScores[section] && studentProf[section as keyof typeof studentProf]) {
            if (studentProf[section as keyof typeof studentProf]! < requiredScores[section]) {
                meetsRequirement = false;
                break;
            }
        }
    }

    if (meetsRequirement && requiredScores.overall) {
        if (studentProf.overallScore >= requiredScores.overall + 1) {
            return { 
                score: 20, 
                reason: `Your ${testType} score exceeds requirements` 
            };
        }
        return { 
            score: 18, 
            reason: `Your ${testType} score meets requirements` 
        };
    }

    return { 
        score: meetsRequirement ? 15 : 5, 
        reason: meetsRequirement ? 'Acceptable English proficiency' : 'May need to improve English scores' 
    };
}

function checkBudget(studentBudget: number, programCost: number): { score: number; reason: string | null } {
    if (!programCost) {
        return { score: 15, reason: 'Cost information available upon request' };
    }

    const ratio = studentBudget / programCost;

    if (ratio >= 1.2) {
        return { 
            score: 15, 
            reason: `Program cost ($${programCost.toLocaleString()}) is well within your budget` 
        };
    } else if (ratio >= 1.0) {
        return { 
            score: 13, 
            reason: `Program cost ($${programCost.toLocaleString()}) matches your budget` 
        };
    } else if (ratio >= 0.8) {
        return { 
            score: 8, 
            reason: `Program cost ($${programCost.toLocaleString()}) is slightly above budget (scholarships may help)` 
        };
    } else if (ratio >= 0.6) {
        return { 
            score: 4, 
            reason: `Program cost is above budget - strong scholarship opportunities recommended` 
        };
    }
    
    return { score: 0, reason: null };
}

function checkFieldMatch(
    preferredField: string, 
    faculty: string, 
    subjectName: string
): { score: number; reason: string | null } {
    if (!preferredField) {
        return { score: 10, reason: 'Field preference not specified' };
    }

    const normalizeField = (field: string) => field.toLowerCase().replace(/[^a-z0-9]/g, '');
    const prefField = normalizeField(preferredField);
    const facultyNorm = normalizeField(faculty || '');
    const subjectNorm = normalizeField(subjectName || '');

    if (facultyNorm.includes(prefField) || prefField.includes(facultyNorm)) {
        return { 
            score: 15, 
            reason: `Matches your preferred field of ${preferredField}` 
        };
    } else if (subjectNorm.includes(prefField) || prefField.includes(subjectNorm)) {
        return { 
            score: 12, 
            reason: `Related to your preferred field of ${preferredField}` 
        };
    }

    return { score: 5, reason: null };
}

function checkPrerequisites(
    studentSubjects: string[], 
    prerequisites?: string[]
): { score: number; reason: string | null } {
    if (!prerequisites || prerequisites.length === 0) {
        return { score: 10, reason: 'No specific prerequisites required' };
    }

    if (!studentSubjects || studentSubjects.length === 0) {
        return { score: 5, reason: null };
    }

    const normalizeSubject = (subj: string) => subj.toLowerCase().replace(/[^a-z0-9]/g, '');
    const studentSubjsNorm = studentSubjects.map(normalizeSubject);
    const prereqsNorm = prerequisites.map(normalizeSubject);

    const matchedCount = prereqsNorm.filter(prereq => 
        studentSubjsNorm.some(studSubj => 
            studSubj.includes(prereq) || prereq.includes(studSubj)
        )
    ).length;

    const matchRatio = matchedCount / prereqsNorm.length;

    if (matchRatio >= 0.8) {
        return { 
            score: 10, 
            reason: 'You have completed most prerequisite subjects' 
        };
    } else if (matchRatio >= 0.5) {
        return { 
            score: 7, 
            reason: 'You have completed some prerequisite subjects' 
        };
    } else if (matchRatio > 0) {
        return { 
            score: 4, 
            reason: 'Some prerequisite subjects may be needed' 
        };
    }

    return { score: 0, reason: null };
}


export {
    getCountries,
    getUniversitiesByCountry,
    matchSubjects
};