'use strict';

const { ulid } = require('ulid');
const CreatorCard = require('../../models/CreatorCard');
const vsl = require('../../lib/vsl');
const { throwBusinessError } = require('../../lib/errors');
const MESSAGES = require('../../messages/creator-cards');

const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;

function generateSlugFromTitle(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
}

function randomSuffix() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function serializeCard(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const { _id, ...rest } = obj;
  return { id: _id, ...rest };
}

async function validateCreatePayload(body) {
  const errors = [];

  const coreSchema = vsl.schema({
    title: vsl.field('title').string().required().min(3).max(100),
    creator_reference: vsl.field('creator_reference').string().required().exact(20),
    status: vsl.field('status').string().required().enum(['draft', 'published']),
  });

  errors.push(...coreSchema.validate(body));

  if (body.description !== undefined && body.description !== null) {
    const descErrors = vsl.field('description').string().max(500).validate(body.description);
    errors.push(...descErrors);
  }

  if (body.slug !== undefined && body.slug !== null) {
    const slugErrors = vsl.field('slug').string().min(5).max(50).pattern(SLUG_PATTERN, 'slug may only contain letters, numbers, hyphens, and underscores').validate(body.slug);
    errors.push(...slugErrors);
  }

  if (body.access_type !== undefined && body.access_type !== null) {
    const atErrors = vsl.field('access_type').string().enum(['public', 'private']).validate(body.access_type);
    errors.push(...atErrors);
  }

  if (body.access_code !== undefined && body.access_code !== null) {
    const acErrors = vsl.field('access_code').string().exact(6).pattern(/^[a-zA-Z0-9]{6}$/, 'access_code must be exactly 6 alphanumeric characters').validate(body.access_code);
    errors.push(...acErrors);
  }

  if (body.links !== undefined && body.links !== null) {
    const linkErrors = vsl.validateLinks(body.links);
    errors.push(...linkErrors);
  }

  if (body.service_rates !== undefined && body.service_rates !== null) {
    const srErrors = vsl.validateServiceRates(body.service_rates);
    errors.push(...srErrors);
  }

  return errors;
}

async function createCreatorCard(body) {
  const validationErrors = await validateCreatePayload(body);
  if (validationErrors.length > 0) {
    return { validationError: vsl.formatError(validationErrors) };
  }

  const accessType = body.access_type || 'public';

  if (accessType === 'private' && !body.access_code) {
    throwBusinessError(MESSAGES.ACCESS_CODE_REQUIRED, 'AC01', 400);
  }

  if (accessType === 'public' && body.access_code) {
    throwBusinessError(MESSAGES.ACCESS_CODE_NOT_ALLOWED, 'AC05', 400);
  }

  if (!body.access_type && body.access_code) {
    throwBusinessError(MESSAGES.ACCESS_CODE_NOT_ALLOWED, 'AC05', 400);
  }

  let slug;

  if (body.slug) {
    const existing = await CreatorCard.findOne({ slug: body.slug, deleted: null });
    if (existing) {
      throwBusinessError(MESSAGES.SLUG_TAKEN, 'SL02', 400);
    }
    slug = body.slug;
  } else {
    let candidate = generateSlugFromTitle(body.title);
    const isTooShort = candidate.length < 5;
    const isTaken = !isTooShort && (await CreatorCard.findOne({ slug: candidate, deleted: null }));

    if (isTooShort || isTaken) {
      candidate = `${candidate}-${randomSuffix()}`;
    }
    slug = candidate;
  }

  const now = Date.now();
  const id = ulid();

  const card = new CreatorCard({
    _id: id,
    title: body.title,
    description: body.description || null,
    slug,
    creator_reference: body.creator_reference,
    links: body.links || [],
    service_rates: body.service_rates || null,
    status: body.status,
    access_type: accessType,
    access_code: accessType === 'private' ? body.access_code : null,
    created: now,
    updated: now,
    deleted: null,
  });

  await card.save();

  return { data: serializeCard(card) };
}

module.exports = { createCreatorCard, serializeCard };
