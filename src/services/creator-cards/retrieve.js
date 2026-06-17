'use strict';

const CreatorCard = require('../../models/CreatorCard');
const { throwBusinessError } = require('../../lib/errors');
const MESSAGES = require('../../messages/creator-cards');

function serializeCardForRetrieval(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const { _id, access_code, ...rest } = obj;
  return { id: _id, ...rest };
}

async function retrieveCreatorCard(slug, accessCode) {
  const card = await CreatorCard.findOne({ slug, deleted: null });

  if (!card) {
    throwBusinessError(MESSAGES.CARD_NOT_FOUND, 'NF01', 404);
  }

  if (card.status === 'draft') {
    throwBusinessError(MESSAGES.CARD_IS_DRAFT, 'NF02', 404);
  }

  if (card.access_type === 'private') {
    if (!accessCode) {
      throwBusinessError(MESSAGES.CARD_IS_PRIVATE, 'AC03', 403);
    }
    if (accessCode !== card.access_code) {
      throwBusinessError(MESSAGES.INVALID_ACCESS_CODE, 'AC04', 403);
    }
  }

  return { data: serializeCardForRetrieval(card) };
}

module.exports = { retrieveCreatorCard };
