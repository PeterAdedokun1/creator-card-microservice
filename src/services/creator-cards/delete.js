'use strict';

const CreatorCard = require('../../models/CreatorCard');
const vsl = require('../../lib/vsl');
const { throwBusinessError } = require('../../lib/errors');
const MESSAGES = require('../../messages/creator-cards');

function serializeCard(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const { _id, ...rest } = obj;
  return { id: _id, ...rest };
}

async function deleteCreatorCard(slug, body) {
  const errors = [];

  const schema = vsl.schema({
    creator_reference: vsl.field('creator_reference').string().required().exact(20),
  });

  errors.push(...schema.validate(body));

  if (errors.length > 0) {
    return { validationError: vsl.formatError(errors) };
  }

  const card = await CreatorCard.findOne({ slug, deleted: null });

  if (!card) {
    throwBusinessError(MESSAGES.CARD_NOT_FOUND, 'NF01', 404);
  }

  const now = Date.now();
  card.deleted = now;
  card.updated = now;
  await card.save();

  return { data: serializeCard(card) };
}

module.exports = { deleteCreatorCard };
