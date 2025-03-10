// Copyright 2025 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../core/i18n/i18n.js';
import { Issue } from './Issue.js';
import { resolveLazyDescription, } from './MarkdownIssueDescription.js';
const UIStrings = {
    /**
     *@description Title for HTTP Message Signatures specification url
     */
    httpMessageSignatures: 'HTTP Message Signatures (RFC9421)',
    /**
     *@description Title for Signature-based Integrity specification url
     */
    signatureBasedIntegrity: 'Signature-based Integrity',
};
const str_ = i18n.i18n.registerUIStrings('models/issues_manager/SRIMessageSignatureIssue.ts', UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
const specLinks = [
    {
        link: 'https://www.rfc-editor.org/rfc/rfc9421.html',
        linkTitle: i18nLazyString(UIStrings.httpMessageSignatures),
    },
    {
        link: 'https://wicg.github.io/signature-based-sri/',
        linkTitle: i18nLazyString(UIStrings.signatureBasedIntegrity),
    }
];
function getIssueCode(details) {
    switch (details.error) {
        case "MissingSignatureHeader" /* Protocol.Audits.SRIMessageSignatureError.MissingSignatureHeader */:
            return "SRIMessageSignatureIssue::MissingSignatureHeader" /* IssueCode.MISSING_SIGNATURE_HEADER */;
        case "MissingSignatureInputHeader" /* Protocol.Audits.SRIMessageSignatureError.MissingSignatureInputHeader */:
            return "SRIMessageSignatureIssue::MissingSignatureInputHeader" /* IssueCode.MISSING_SIGNATURE_INPUT_HEADER */;
        case "InvalidSignatureHeader" /* Protocol.Audits.SRIMessageSignatureError.InvalidSignatureHeader */:
            return "SRIMessageSignatureIssue::InvalidSignatureHeader" /* IssueCode.INVALID_SIGNATURE_HEADER */;
        case "InvalidSignatureInputHeader" /* Protocol.Audits.SRIMessageSignatureError.InvalidSignatureInputHeader */:
            return "SRIMessageSignatureIssue::InvalidSignatureInputHeader" /* IssueCode.INVALID_SIGNATURE_INPUT_HEADER */;
        case "SignatureHeaderValueIsNotByteSequence" /* Protocol.Audits.SRIMessageSignatureError.SignatureHeaderValueIsNotByteSequence */:
            return "SRIMessageSignatureIssue::SignatureHeaderValueIsNotByteSequence" /* IssueCode.SIGNATURE_HEADER_VALUE_IS_NOT_BYTE_SEQUENCE */;
        case "SignatureHeaderValueIsParameterized" /* Protocol.Audits.SRIMessageSignatureError.SignatureHeaderValueIsParameterized */:
            return "SRIMessageSignatureIssue::SignatureHeaderValueIsParameterized" /* IssueCode.SIGNATURE_HEADER_VALUE_IS_PARAMETERIZED */;
        case "SignatureHeaderValueIsIncorrectLength" /* Protocol.Audits.SRIMessageSignatureError.SignatureHeaderValueIsIncorrectLength */:
            return "SRIMessageSignatureIssue::SignatureHeaderValueIsIncorrectLength" /* IssueCode.SIGNATURE_HEADER_VALUE_IS_INCORRECT_LENGTH */;
        case "SignatureInputHeaderMissingLabel" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderMissingLabel */:
            return "SRIMessageSignatureIssue::SignatureInputHeaderMissingLabel" /* IssueCode.SIGNATURE_INPUT_HEADER_MISSING_LABEL */;
        case "SignatureInputHeaderValueNotInnerList" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderValueNotInnerList */:
            return "SRIMessageSignatureIssue::SignatureInputHeaderValueNotInnerList" /* IssueCode.SIGNATURE_INPUT_HEADER_VALUE_NOT_INNER_LIST */;
        case "SignatureInputHeaderValueMissingComponents" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderValueMissingComponents */:
            return "SRIMessageSignatureIssue::SignatureInputHeaderValueMissingComponents" /* IssueCode.SIGNATURE_INPUT_HEADER_VALUE_MISSING_COMPONENTS */;
        case "SignatureInputHeaderInvalidComponentType" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderInvalidComponentType */:
            return "SRIMessageSignatureIssue::SignatureInputHeaderInvalidComponentType" /* IssueCode.SIGNATURE_INPUT_HEADER_INVALID_COMPONENT_TYPE */;
        case "SignatureInputHeaderInvalidComponentName" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderInvalidComponentName */:
            return "SRIMessageSignatureIssue::SignatureInputHeaderInvalidComponentName" /* IssueCode.SIGNATURE_INPUT_HEADER_INVALID_COMPONENT_NAME */;
        case "SignatureInputHeaderInvalidHeaderComponentParameter" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderInvalidHeaderComponentParameter */:
            return "SRIMessageSignatureIssue::SignatureInputHeaderInvalidHeaderComponentParameter" /* IssueCode.SIGNATURE_INPUT_HEADER_INVALID_HEADER_COMPONENT_PARAMETER */;
        case "SignatureInputHeaderInvalidDerivedComponentParameter" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderInvalidDerivedComponentParameter */:
            return "SRIMessageSignatureIssue::SignatureInputHeaderInvalidDerivedComponentParameter" /* IssueCode.SIGNATURE_INPUT_HEADER_INVALID_DERIVED_COMPONENT_PARAMETER */;
        case "SignatureInputHeaderKeyIdLength" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderKeyIdLength */:
            return "SRIMessageSignatureIssue::SignatureInputHeaderKeyIdLength" /* IssueCode.SIGNATURE_INPUT_HEADER_KEY_ID_LENGTH */;
        case "SignatureInputHeaderInvalidParameter" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderInvalidParameter */:
            return "SRIMessageSignatureIssue::SignatureInputHeaderInvalidParameter" /* IssueCode.SIGNATURE_INPUT_HEADER_INVALID_PARAMETER */;
        case "SignatureInputHeaderMissingRequiredParameters" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderMissingRequiredParameters */:
            return "SRIMessageSignatureIssue::SignatureInputHeaderMissingRequiredParameters" /* IssueCode.SIGNATURE_INPUT_HEADER_MISSING_REQUIRED_PARAMETERS */;
        case "ValidationFailedSignatureExpired" /* Protocol.Audits.SRIMessageSignatureError.ValidationFailedSignatureExpired */:
            return "SRIMessageSignatureIssue::ValidationFailedSignatureExpired" /* IssueCode.VALIDATION_FAILED_SIGNATURE_EXPIRED */;
        case "ValidationFailedInvalidLength" /* Protocol.Audits.SRIMessageSignatureError.ValidationFailedInvalidLength */:
            return "SRIMessageSignatureIssue::ValidationFailedInvalidLength" /* IssueCode.VALIDATION_FAILED_INVALID_LENGTH */;
        case "ValidationFailedSignatureMismatch" /* Protocol.Audits.SRIMessageSignatureError.ValidationFailedSignatureMismatch */:
            return "SRIMessageSignatureIssue::ValidationFailedSignatureMismatch" /* IssueCode.VALIDATION_FAILED_SIGNATURE_MISMATCH */;
    }
}
export class SRIMessageSignatureIssue extends Issue {
    #issueDetails;
    constructor(issueDetails, issuesModel) {
        super({
            code: getIssueCode(issueDetails),
            umaCode: [
                "SRIMessageSignatureIssue" /* Protocol.Audits.InspectorIssueCode.SRIMessageSignatureIssue */,
                issueDetails.error,
            ].join('::'),
        }, issuesModel);
        this.#issueDetails = issueDetails;
    }
    requests() {
        if (this.#issueDetails.request) {
            return [this.#issueDetails.request];
        }
        return [];
    }
    getCategory() {
        return "Other" /* IssueCategory.OTHER */;
    }
    details() {
        return this.#issueDetails;
    }
    getDescription() {
        const description = issueDescriptions.get(this.#issueDetails.error);
        if (!description) {
            return null;
        }
        return resolveLazyDescription(description);
    }
    primaryKey() {
        return JSON.stringify(this.#issueDetails);
    }
    getKind() {
        return "PageError" /* IssueKind.PAGE_ERROR */;
    }
    static fromInspectorIssue(issuesModel, inspectorIssue) {
        const details = inspectorIssue.details.sriMessageSignatureIssueDetails;
        if (!details) {
            console.warn('SRI Message Signature issue without details received.');
            return [];
        }
        return [new SRIMessageSignatureIssue(details, issuesModel)];
    }
}
const issueDescriptions = new Map([
    [
        "MissingSignatureHeader" /* Protocol.Audits.SRIMessageSignatureError.MissingSignatureHeader */,
        {
            file: 'sriMissingSignatureHeader.md',
            links: specLinks,
        },
    ],
    [
        "MissingSignatureInputHeader" /* Protocol.Audits.SRIMessageSignatureError.MissingSignatureInputHeader */,
        {
            file: 'sriMissingSignatureInputHeader.md',
            links: specLinks,
        },
    ],
    [
        "InvalidSignatureHeader" /* Protocol.Audits.SRIMessageSignatureError.InvalidSignatureHeader */,
        {
            file: 'sriInvalidSignatureHeader.md',
            links: specLinks,
        },
    ],
    [
        "InvalidSignatureInputHeader" /* Protocol.Audits.SRIMessageSignatureError.InvalidSignatureInputHeader */,
        {
            file: 'sriInvalidSignatureInputHeader.md',
            links: specLinks,
        },
    ],
    [
        "SignatureHeaderValueIsNotByteSequence" /* Protocol.Audits.SRIMessageSignatureError.SignatureHeaderValueIsNotByteSequence */,
        {
            file: 'sriSignatureHeaderValueIsNotByteSequence.md',
            links: specLinks,
        },
    ],
    [
        "SignatureHeaderValueIsParameterized" /* Protocol.Audits.SRIMessageSignatureError.SignatureHeaderValueIsParameterized */,
        {
            file: 'sriSignatureHeaderValueIsParameterized.md',
            links: specLinks,
        },
    ],
    [
        "SignatureHeaderValueIsIncorrectLength" /* Protocol.Audits.SRIMessageSignatureError.SignatureHeaderValueIsIncorrectLength */,
        {
            file: 'sriSignatureHeaderValueIsIncorrectLength.md',
            links: specLinks,
        },
    ],
    [
        "SignatureInputHeaderMissingLabel" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderMissingLabel */,
        {
            file: 'sriSignatureInputHeaderMissingLabel.md',
            links: specLinks,
        },
    ],
    [
        "SignatureInputHeaderValueNotInnerList" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderValueNotInnerList */,
        {
            file: 'sriSignatureInputHeaderValueNotInnerList.md',
            links: specLinks,
        },
    ],
    [
        "SignatureInputHeaderValueMissingComponents" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderValueMissingComponents */,
        {
            file: 'sriSignatureInputHeaderValueMissingComponents.md',
            links: specLinks,
        },
    ],
    [
        "SignatureInputHeaderInvalidComponentType" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderInvalidComponentType */,
        {
            file: 'sriSignatureInputHeaderInvalidComponentType.md',
            links: specLinks,
        },
    ],
    [
        "SignatureInputHeaderInvalidComponentName" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderInvalidComponentName */,
        {
            file: 'sriSignatureInputHeaderInvalidComponentName.md',
            links: specLinks,
        },
    ],
    [
        "SignatureInputHeaderInvalidHeaderComponentParameter" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderInvalidHeaderComponentParameter */,
        {
            file: 'sriSignatureInputHeaderInvalidHeaderComponentParameter.md',
            links: specLinks,
        },
    ],
    [
        "SignatureInputHeaderInvalidDerivedComponentParameter" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderInvalidDerivedComponentParameter */,
        {
            file: 'sriSignatureInputHeaderInvalidDerivedComponentParameter.md',
            links: specLinks,
        },
    ],
    [
        "SignatureInputHeaderKeyIdLength" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderKeyIdLength */,
        {
            file: 'sriSignatureInputHeaderKeyIdLength.md',
            links: specLinks,
        },
    ],
    [
        "SignatureInputHeaderInvalidParameter" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderInvalidParameter */,
        {
            file: 'sriSignatureInputHeaderInvalidParameter.md',
            links: specLinks,
        },
    ],
    [
        "SignatureInputHeaderMissingRequiredParameters" /* Protocol.Audits.SRIMessageSignatureError.SignatureInputHeaderMissingRequiredParameters */,
        {
            file: 'sriSignatureInputHeaderMissingRequiredParameters.md',
            links: specLinks,
        },
    ],
    [
        "ValidationFailedSignatureExpired" /* Protocol.Audits.SRIMessageSignatureError.ValidationFailedSignatureExpired */,
        {
            file: 'sriValidationFailedSignatureExpired.md',
            links: specLinks,
        },
    ],
    [
        "ValidationFailedInvalidLength" /* Protocol.Audits.SRIMessageSignatureError.ValidationFailedInvalidLength */,
        {
            file: 'sriValidationFailedInvalidLength.md',
            links: specLinks,
        },
    ],
    [
        "ValidationFailedSignatureMismatch" /* Protocol.Audits.SRIMessageSignatureError.ValidationFailedSignatureMismatch */,
        {
            file: 'sriValidationFailedSignatureMismatch.md',
            links: specLinks,
        },
    ],
]);
//# sourceMappingURL=SRIMessageSignatureIssue.js.map