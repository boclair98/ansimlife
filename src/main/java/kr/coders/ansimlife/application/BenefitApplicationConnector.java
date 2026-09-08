package kr.coders.ansimlife.application;

import kr.coders.ansimlife.support.SupportProgram;

/**
 * Adapter contract for an approved benefit-provider submission API.
 * A connector must return the receipt issued by the external institution;
 * storing a draft inside AnsimLife is never considered a submission.
 */
public interface BenefitApplicationConnector {

    String providerCode();

    boolean supports(SupportProgram program);

    ExternalApplicationReceipt submit(ExternalApplicationRequest request);
}
