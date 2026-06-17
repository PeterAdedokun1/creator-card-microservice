'use strict';

const { deleteCreatorCard } = require('../../services/creator-cards/delete');
const MESSAGES = require('../../messages/creator-cards');

async function deleteCreatorCardEndpoint(req, res, next) {
  try {
    const { slug } = req.params;
    const result = await deleteCreatorCard(slug, req.body);

    if (result.validationError) {
      return res.status(400).json(result.validationError);
    }

    return res.status(200).json({
      status: 'success',
      message: MESSAGES.DELETE_SUCCESS,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = deleteCreatorCardEndpoint;
