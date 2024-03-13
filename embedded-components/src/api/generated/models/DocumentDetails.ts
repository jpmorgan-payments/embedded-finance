/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { DocumentMetadata } from './DocumentMetadata';
import type { DocumentType } from './DocumentType';
import type { ProductType } from './ProductType';

export type DocumentDetails = {
    /**
     * The unique id generated by the system for the uploaded document,  which can be used for future retrieval.
 * 
     */
    id?: string;
    documentType?: DocumentType;
    productType?: ProductType;
    metadata?: Array<DocumentMetadata>;
};