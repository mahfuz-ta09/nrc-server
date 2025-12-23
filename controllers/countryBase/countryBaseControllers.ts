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


const createCountryBase = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        await authChecker(req, res, ["admin", "super_admin"]);
        
        const { country, serial, slug, currency, content, meta_description, meta_title } = req.body;
        
        const files: any = req.files;

        if (!country || !serial || !slug || !files["countryFlag"]?.[0] || 
            !files["famousFile"]?.[0] || !currency || !content || !meta_title) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Required fields missing: country, serial, slug, countryFlag, famousFile, currency, content, meta_title',
            });
        }

        const cleanSlug = slug.toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");

        const exist = await collection.findOne({
            $or: [
                { country: country?.toLowerCase() },
                { slug: cleanSlug }
            ]
        });
        
        if (exist) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: `A country with name "${country}" or slug "${cleanSlug}" already exists`,
            });
        }

        const local_country: any = await fileUploadHelper.uploadToCloud(files["countryFlag"]?.[0]);
        const local_flag: any = await fileUploadHelper.uploadToCloud(files["famousFile"]?.[0]);

        const insertedObject: any = {
            type: "study-option",
            country: country.toLowerCase(),
            slug: cleanSlug,
            
            seo: {
                metaTitle: meta_title,
                metaDescription: meta_description || `Study in ${country}. Explore top universities, programs, admission requirements, costs, and student life.`,
                keywords: [
                    `study in ${country.toLowerCase()}`,
                    `universities in ${country.toLowerCase()}`,
                    `${country.toLowerCase()} education`,
                    `study abroad ${country.toLowerCase()}`,
                    `${country.toLowerCase()} student visa`
                ],
                canonicalUrl: `${process.env.SITE_URL || 'https://www.nrcedu-uk.com'}/${cleanSlug}`,
                ogTitle: meta_title,
                ogDescription: meta_description || `Complete guide to studying in ${country}`,
                ogImage: local_flag?.secure_url
            },
            
            currency: currency,
            serial: Number(serial),
            
            content: content,
            bodyImages: [],

            countryFlg: {
                url: local_country?.secure_url,
                publicId: local_country?.public_id,
            },

            famousFile: {
                url: local_flag?.secure_url,
                publicId: local_flag?.public_id,
            },
            
            status: 'published',
            
            analytics: {
                views: 0,
                inquiries: 0,
                lastViewedAt: null
            },
            
            statistics: {
                totalUniversities: 0,
                internationalStudents: null,
                popularPrograms: []
            },
            
            createdAt: format(new Date(), "MM/dd/yyyy"),
            updatedAt: format(new Date(), "MM/dd/yyyy"),
            publishedAt: format(new Date(), "MM/dd/yyyy"),
            
            universityList: []
        };

        let body = content;
        try {
            body = JSON.parse(content);
        } catch {}

        if (files["content_image"]?.length > 0) {
            const uploadedUrls: { url: string; publicID: string; alt: string }[] = [];
            for (let i = 0; i < files["content_image"].length; i++) {
                const uploaded: any = await fileUploadHelper.uploadToCloud(files["content_image"][i]);
                uploadedUrls.push({ 
                    url: uploaded.secure_url, 
                    publicID: uploaded.public_id,
                    alt: `Study in ${country} - Image ${i + 1}`
                });
                body = body.replace(`__IMAGE_${i}__`, uploaded.secure_url);
            }
            insertedObject.bodyImages = uploadedUrls;
            insertedObject.content = body;
        }

        
        const result = await collection.insertOne(insertedObject);
        
        if (!result.acknowledged) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Failed to create country",
                data: result,
            });
        }

        return sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "Country created successfully!",
            data: result,
        });
        
    } catch (error) {
        console.error('Error in createCountryBase:', error);
        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


const editCountryBase = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        await authChecker(req, res, ["admin", "super_admin"]);

        const id = req.params.id;
        const { country, serial, slug, currency, content, meta_title, meta_description,status } = req.body;
        const files: any = req.files;

        if (!country && !serial && !slug && !files["countryFlag"]?.[0] && 
            !files["famousFile"]?.[0] && !currency && content ==='<p><br></p>' && 
            !meta_title && !meta_description && !status) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'No fields provided to update',
            });
        }

        const query = { _id: new ObjectId(id) };
        const countryObj = await collection.findOne(query);

        if (!countryObj) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: 'Country not found with the given ID',
            });
        }

        
        const cleanSlug = slug ? slug.toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-") : countryObj.slug;

            
        if (country || slug) {
            const exist = await collection.findOne({
                _id: { $ne: new ObjectId(id) },
                $or: [
                    ...(country ? [{ country: country.toLowerCase() }] : []),
                    ...(slug ? [{ slug: cleanSlug }] : [])
                ]
            });
            
            if (exist) {
                return sendResponse(res, {
                    statusCode: 400,
                    success: false,
                    message: 'Another country already exists with this name or slug',
                });
            }
        }

        let uploadedFlag: any = null;
        let uploadedFamous: any = null;

        if (files["countryFlag"]?.[0]) {
            uploadedFlag = await fileUploadHelper.uploadToCloud(files["countryFlag"]?.[0]);
            if (countryObj.countryFlg?.publicId) {
                await fileUploadHelper.deleteFromCloud(countryObj.countryFlg.publicId);
            }
        }

        if (files["famousFile"]?.[0]) {
            uploadedFamous = await fileUploadHelper.uploadToCloud(files["famousFile"]?.[0]);
            if (countryObj.famousFile?.publicId) {
                await fileUploadHelper.deleteFromCloud(countryObj.famousFile.publicId);
            }
        }

        const updatedCountryName = country ? country.toLowerCase() : countryObj.country;

        const insertedObject: any = {
            country: updatedCountryName,
            slug: cleanSlug,
            
            seo: {
                metaTitle: meta_title || countryObj.seo?.metaTitle || countryObj.meta_title,
                metaDescription: meta_description || countryObj.seo?.metaDescription || countryObj.meta_description,
                keywords: countryObj.seo?.keywords || [
                    `study in ${updatedCountryName}`,
                    `universities in ${updatedCountryName}`,
                    `${updatedCountryName} education`
                ],
                canonicalUrl: `${process.env.SITE_URL || 'https://www.nrcedu-uk.com'}/${cleanSlug}`,
                ogTitle: meta_title || countryObj.seo?.ogTitle || countryObj.meta_title,
                ogDescription: meta_description || countryObj.seo?.ogDescription || countryObj.meta_description,
                ogImage: uploadedFamous?.secure_url || countryObj.famousFile?.url || countryObj.seo?.ogImage
            },
            
            currency: currency || countryObj.currency,
            serial: serial ? Number(serial) : countryObj.serial,
            
            content: content==='<p><br></p>'? countryObj.content : content,
            bodyImages: countryObj.bodyImages || [],

            countryFlg: {
                url: uploadedFlag?.secure_url || countryObj.countryFlg?.url,
                publicId: uploadedFlag?.public_id || countryObj.countryFlg?.publicId,
            },

            famousFile: {
                url: uploadedFamous?.secure_url || countryObj.famousFile?.url,
                publicId: uploadedFamous?.public_id || countryObj.famousFile?.publicId,
            },
            
            status: status || countryObj.status || 'published',
            analytics: countryObj.analytics || { views: 0, inquiries: 0 },
            statistics: countryObj.statistics || { totalUniversities: 0 },
            createdAt: countryObj.createdAt,
            updatedAt: format(new Date(), "MM/dd/yyyy"),
            publishedAt: countryObj.publishedAt || format(new Date(), "MM/dd/yyyy"),

            universityList: countryObj.universityList || []
        };

        if (content && content !== '<p><br></p>') {
            let body = content;
            try {
                body = JSON.parse(content);
            } catch {}

            if (insertedObject.bodyImages) {
                for (const item of insertedObject.bodyImages) {
                    if (item?.publicID) {
                        await fileUploadHelper.deleteFromCloud(item.publicID);
                    }
                }
                insertedObject.bodyImages = [];
            }

            const uploadedUrls: { url: string; publicID: string; alt: string }[] = [];
            if (files?.["content_image"]?.length > 0) {
                for (let i = 0; i < files["content_image"].length; i++) {
                    const uploaded: any = await fileUploadHelper.uploadToCloud(files["content_image"][i]);
                    uploadedUrls.push({ 
                        url: uploaded.secure_url, 
                        publicID: uploaded.public_id,
                        alt: `Study in ${updatedCountryName} - Image ${i + 1}`
                    });
                    body = body.replace(`__IMAGE_${i}__`, uploaded.secure_url);
                }
                insertedObject.bodyImages = uploadedUrls;
            }
            
            insertedObject.content = body;
        }

        insertedObject.statistics.totalUniversities = countryObj.universityList?.length || 0;
        const updateDoc = { $set: insertedObject };
        const result = await collection.updateOne(query, updateDoc);

        if (!result.acknowledged || result.modifiedCount === 0) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'No changes were made',
            });
        }

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Country updated successfully!',
            data: result,
        });
        
    } catch (error) {
        console.error('Error in editCountryBase:', error);
        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message:error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


const getCountryBySlug = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        
        const slug = req.params.slug;
        
        if (!slug) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Slug is required',
            });
        }

        const query = { slug: slug };
        const country = await collection.findOne(query)
        if (!country) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: 'Country not found or not visible',
            });
        }

        
        collection.updateOne(
            { _id: country._id },
            {
                $inc: { 'analytics.views': 1 },
                $set: { 'analytics.lastViewedAt': format(new Date(), "MM/dd/yyyy HH:mm") }
            }
        ).catch((err:any) => console.error('Failed to update analytics:', err));

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Country retrieved successfully',
            data: country
        });
        
    } catch (err) {
        console.error('Error in getCountryBySlug:', err);
        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message: 'Internal Server Error'
        });
    }
};


const getAllCountryBase = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection("country-uni");
        
        const { includeHidden } = req.query;
        
        
        const query: any = {};
        if (includeHidden !== 'true') {
            // query.isVisible = true;
        }
        
        const countryBase = await collection
            .find(query,{ projection: { universityList: 0 } })
            .sort({ serial: 1 }).toArray();
        
        const countBaseCount = await collection.countDocuments(query);
        if (countryBase.length === 0) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "No countries found",
                data: []
            });
        }

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Countries retrieved successfully",
            data: countryBase,
            meta: {
                total: countBaseCount
            }
        });
        
    } catch (error) {
        console.error("Error in getAllCountryBase:", error);
        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


const deleteCountryBase = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        await authChecker(req, res, ["admin", "super_admin"]);

        const id = req.params.id;
        
        if (!id) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'ID is required',
            });
        }

        const query = { _id: new ObjectId(id) };
        const countryObj = await collection.findOne(query);
        
        if (!countryObj) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: 'Country not found',
            });
        }
        
        if (Array.isArray(countryObj?.universityList) && countryObj.universityList.length > 0) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: `Cannot delete country with ${countryObj.universityList.length} universities. Delete universities first.`,
            });
        }

        // Delete associated files
        if (countryObj?.countryFlg?.publicId) {
            await fileUploadHelper.deleteFromCloud(countryObj.countryFlg.publicId);
        }
        if (countryObj?.famousFile?.publicId) {
            await fileUploadHelper.deleteFromCloud(countryObj.famousFile.publicId);
        }
        
        if (countryObj?.bodyImages) {
            for (const image of countryObj.bodyImages || []) {
                if (image?.publicID) {
                    await fileUploadHelper.deleteFromCloud(image.publicID);
                }
            }
        }
        
        const result = await collection.deleteOne(query);
        
        if (!result.acknowledged) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Failed to delete country",
            });
        }

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Country deleted successfully!",
            data: result
        });
        
    } catch (error) {
        console.error('Error in deleteCountryBase:', error);
        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


const countryBaseCollectionName = async (req: AuthenticatedRequest , res: Response) => {
    try{
        const db = getDb();
        const collection = db.collection('country-uni');
        const countries = await collection
            .find({})
            .project({country: 1, slug:1, _id: 1, "countryFlg.url":1})
            .toArray();
            
        const totalDoc = await collection.countDocuments();
        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Countries retrieved successfully",
            data: countries,
            meta:{
                total: totalDoc
            }
        });
    }catch(error){
        console.error('Error in countryBaseCollectionName:', error);
        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export {
    createCountryBase,
    editCountryBase,
    getCountryBySlug,
    getAllCountryBase,
    deleteCountryBase,
    countryBaseCollectionName
};