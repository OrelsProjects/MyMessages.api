const { randomDigits } = require("crypto-secure-random-digit");
const aws = require("aws-sdk");

const sns = new aws.SNS({ region: "us-east-1" });

const createAuthChallenge = async (event = {}) => {
  let secrentLoginCode;
  if (!event.request?.session || event.request?.session?.length === 0) {
    var phoneNumber = event.request.userAttributes.phone_number;
    secrentLoginCode = randomDigits(6).join("");
    await sendSMSviaSNS(phoneNumber, secrentLoginCode);
  } else {
    const previousChallenge = event.request.session.slice(-1)[0];
    secrentLoginCode =
      previousChallenge.challengeMetadata.match(/CODE-(\d*)/)[1];
  }
  event.response.publicChallengeParameters = {
    phone: event.request.userAttributes.phone_number,
  };
  event.response.challengeMetadata = `CODE-${secrentLoginCode}`;
  return event;
};

const sendSMSviaSNS = async (phoneNumber, secretCode) => {
  const params = {
    Message: "Your verification code is " + secretCode,
    PhoneNumber: phoneNumber,
  };
  return sns.publish(params).promise();
};

const defineAuthChallenge = async (event) => {
  if (
    event.request.session &&
    event.request.session.find(
      (attempt) =>
        attempt.challengeName === "CUSTOM_CHALLENGE" && !attempt.challengeResult
    )
  ) {
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
  } else if (
    event.request.session &&
    event.request.session.length >= 3 &&
    event.requuest.session.slice(-1)[0].challengeResult === false
  ) {
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
  } else if (
    event.request.session &&
    event.request.session.length &&
    event.request.session.slice(-1)[0].challengeResult === true &&
    event.request.session.slice(-1)[0].challengeName === "CUSTOM_CHALLENGE"
  ) {
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
  } else {
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = "CUSTOM_CHALLENGE";
  }

  return event;
};

const verifyAuthChallengeResponse = async (event) => {
  const expectedAnswer =
    event.request.privateChallengeParameters.secrentLoginCode;
  if (event.request.challengeAnswer === expectedAnswer) {
    event.response.answerCorrect = true;
  } else {
    event.response.answerCorrect = false;
  }
  return event;
};

module.exports = {
  createAuthChallenge,
  defineAuthChallenge,
  verifyAuthChallengeResponse,
};
