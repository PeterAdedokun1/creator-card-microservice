'use strict';

const { retrieveCreatorCard } = require('../../services/creator-cards/retrieve');
const MESSAGES = require('../../messages/creator-cards');

async function retrieveCreatorCardEndpoint(req, res, next) {
  try {
    const { slug } = req.params;
    const { access_code } = req.query;

    const result = await retrieveCreatorCard(slug, access_code);

    return res.status(200).json({
      status: 'success',
      message: MESSAGES.RETRIEVE_SUCCESS,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = retrieveCreatorCardEndpoint;
