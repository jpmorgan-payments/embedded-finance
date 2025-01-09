# Schema Validation Documentation

## Individual Schema Fields

| Field Name          | OAS Pattern               | OAS Description                    | Schema (Zod) Validations                                                                                                   |
| ------------------- | ------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| firstName           | `/^[a-zA-Z\s'-]+$/`       | Legal first name of the individual | - Min length: 2<br>- Max length: 30<br>- No leading/trailing spaces<br>- No consecutive spaces<br>- No consecutive hyphens |
| middleName          | `/^[a-zA-Z\s'-]+$/`       | Middle name of the individual      | - Max length: 30<br>- Optional                                                                                             |
| lastName            | `/^[a-zA-Z\s'-]+$/`       | Legal last name of the individual  | - Min length: 2<br>- Max length: 30<br>- No leading/trailing spaces<br>- No consecutive spaces<br>- No consecutive hyphens |
| nameSuffix          | `/^[A-Z]+\.?$\|^[IVX]+$/` | Name suffix (e.g., Jr., Sr., III)  | - Min length: 1<br>- Max length: 5<br>- Optional                                                                           |
| birthDate           | `/^\d{4}-\d{2}-\d{2}$/`   | Date of birth (YYYY-MM-DD)         | - Valid date format<br>- Not in future<br>- Age ≥ 18<br>- Age ≤ 120                                                        |
| countryOfResidence  | N/A                       | Country of residence               | - Exactly 2 characters                                                                                                     |
| jobTitle            | `/^[a-zA-Z0-9\s,.&-]+$/`  | Individual's job title             | - Min length: 2<br>- Max length: 50<br>- No leading/trailing spaces                                                        |
| jobTitleDescription | `/^[a-zA-Z0-9\s,.&-]+$/`  | Description of job role            | - Max length: 50<br>- No HTML tags<br>- No URLs<br>- Optional                                                              |
| natureOfOwnership   | N/A                       | Nature of ownership                | - Enum: ['Direct', 'Indirect']<br>- Optional                                                                               |
| soleOwner           | N/A                       | Whether individual is sole owner   | - Boolean<br>- Optional                                                                                                    |

## Individual ID Fields

| Field Name    | OAS Pattern             | OAS Description      | Schema (Zod) Validations                                                                    |
| ------------- | ----------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| individualIds | N/A                     | Government IDs       | - Min items: 1<br>- Max items: 16<br>- Unique ID types                                      |
| idType        | N/A                     | Type of ID           | - Enum: ['SSN', 'ITIN']                                                                     |
| value         | N/A                     | ID number            | - No spaces<br>- SSN format: 9 digits<br>- ITIN format: starts with 9, followed by 8 digits |
| issuer        | N/A                     | ID issuing authority | - Exactly 2 characters                                                                      |
| expiryDate    | `/^\d{4}-\d{2}-\d{2}$/` | ID expiration date   | - Valid date format<br>- Must be future date<br>- Max 10 years from now<br>- Optional       |

## Individual Phone Fields

| Field Name      | OAS Pattern | OAS Description   | Schema (Zod) Validations                                      |
| --------------- | ----------- | ----------------- | ------------------------------------------------------------- |
| individualPhone | N/A         | Phone information | - Required                                                    |
| phoneType       | N/A         | Type of phone     | - Enum: ['BUSINESS_PHONE', 'MOBILE_PHONE', 'ALTERNATE_PHONE'] |
| phoneNumber     | N/A         | Phone number      | - Format: +[country code][number]<br>- No personal numbers    |

## Organization Schema Fields

| Field Name              | OAS Pattern                        | OAS Description          | Schema (Zod) Validations                                                                                                           |
| ----------------------- | ---------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| organizationName        | `/^[a-zA-Z0-9()_/&+%@#;,.: -?]*$/` | Legal organization name  | - Min length: 2<br>- Max length: 100<br>- No leading/trailing spaces<br>- No consecutive spaces<br>- No special chars at start/end |
| dbaName                 | `/^[a-zA-Z0-9()_/&+%@#;,.: -?]*$/` | Doing Business As name   | - Min length: 2<br>- Max length: 100<br>- No leading/trailing spaces<br>- No consecutive spaces<br>- Optional                      |
| organizationEmail       | N/A                                | Business email address   | - Valid email format<br>- Max length: 100<br>- No personal domains (gmail.com, yahoo.com, hotmail.com, outlook.com, aol.com)       |
| yearOfFormation         | `/^(19\|20)\d{2}$/`                | Year business was formed | - Year between 1800 and current<br>- Valid format (YYYY)                                                                           |
| organizationDescription | N/A                                | Business description     | - Min length: 10<br>- Max length: 500<br>- No HTML tags<br>- No URLs                                                               |
| organizationPhone       | N/A                                | Organization phone       | - Required<br>- Same validation as Individual Phone Fields                                                                         |
| tradeOverInternet       | N/A                                | Internet trading status  | - Enum: ['yes', 'no']                                                                                                              |

## Organization ID Fields

| Field Name      | OAS Pattern             | OAS Description      | Schema (Zod) Validations                                                                       |
| --------------- | ----------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| organizationIds | N/A                     | Organization IDs     | - Min items: 1<br>- Max items: 6<br>- Unique ID types                                          |
| description     | N/A                     | ID description       | - Max length: 100<br>- Optional                                                                |
| idType          | N/A                     | Type of business ID  | - Enum: ['EIN', 'BUSINESS_REGISTRATION_ID', 'BUSINESS_NUMBER', 'BUSINESS_REGISTRATION_NUMBER'] |
| value           | `/^[A-Za-z0-9-]+$/`     | ID value             | - Min length: 1<br>- Max length: 100<br>- EIN format: `/^\d{9}$/` when type is EIN             |
| issuer          | N/A                     | ID issuing authority | - Min length: 1<br>- Max length: 500                                                           |
| expiryDate      | `/^\d{4}-\d{2}-\d{2}$/` | ID expiration date   | - Valid date format<br>- Must be future date<br>- Max 10 years from now<br>- Optional          |

## Business Details

| Field Name          | OAS Pattern              | OAS Description            | Schema (Zod) Validations                                                                       |
| ------------------- | ------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------- |
| website             | N/A                      | Business website URL       | - Valid URL format<br>- Max length: 500<br>- HTTPS required<br>- No IP addresses<br>- Optional |
| websiteAvailable    | N/A                      | Has business website       | - Boolean<br>- If true, website is required                                                    |
| mcc                 | `/^\d{4}$/`              | Merchant Category Code     | - 4 digits<br>- Range: 1-9999<br>- Optional if empty string                                    |
| secondaryMccList    | N/A                      | Additional MCCs            | - Max 50 items<br>- Each MCC: 4 digits                                                         |
| industryCategory    | `/^[a-zA-Z0-9\s,.&-]+$/` | Business industry category | - Min length: 3<br>- Max length: 100                                                           |
| industryType        | N/A                      | Specific industry type     | - Min length: 3<br>- Max length: 100                                                           |
| entitiesInOwnership | N/A                      | Has subsidiary entities    | - Enum: ['yes', 'no']                                                                          |
| associatedCountries | N/A                      | Countries of operation     | - Max 100 countries<br>- Each country: 2 characters                                            |

## Address Fields

| Field Name   | OAS Pattern               | OAS Description           | Schema (Zod) Validations                                                                                                          |
| ------------ | ------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| addresses    | N/A                       | Business addresses        | - Min items: 1<br>- Max items: 5<br>- Unique address types                                                                        |
| addressType  | N/A                       | Type of address           | - Enum: ['LEGAL_ADDRESS', 'MAILING_ADDRESS', 'BUSINESS_ADDRESS', 'RESIDENTIAL_ADDRESS']                                           |
| addressLines | `/^[a-zA-Z0-9\s,.#'-]+$/` | Street address lines      | - Min items: 1<br>- Max items: 5<br>- Max length per line: 60<br>- First line must start with number<br>- No PO Box in first line |
| city         | `/^[a-zA-Z\s.-]+$/`       | City name                 | - Max length: 34                                                                                                                  |
| state        | `/^[a-zA-Z\s.-]+$/`       | State/province name       | - Max length: 30<br>- Optional                                                                                                    |
| postalCode   | Custom regex              | Postal/ZIP code           | - Max length: 10<br>- US format: 5 or 9 digits<br>- CA format: A1A 1A1                                                            |
| country      | N/A                       | ISO 2-letter country code | - Exactly 2 characters                                                                                                            |

## Additional Questions Fields

| Field Name     | OAS Pattern             | OAS Description | Schema (Zod) Validations                                                                                                                |
| -------------- | ----------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| question\_[id] | Varies by question type | Question answer | - Type based on question (string/boolean/integer)<br>- Required unless parent question condition not met<br>- Format validation by type |
| dateQuestions  | `/^\d{4}-\d{2}-\d{2}$/` | Date answers    | - Valid date format (for questions with IDs: 30071, 30073)<br>- Required if parent question condition met                               |
| arrayQuestions | N/A                     | Array answers   | - Min/max items based on question config<br>- Each item validates against question type<br>- Required number of items if condition met  |

Notes:

1. Additional Questions schema is dynamically generated based on the questions data
2. Each question field is prefixed with "question\_" followed by the question ID
3. Validation rules depend on:
   - Question type (string/boolean/integer)
   - Whether it's a date question
   - Whether it's an array question
   - Parent question conditions
   - Enum values if specified
   - Custom patterns if specified
