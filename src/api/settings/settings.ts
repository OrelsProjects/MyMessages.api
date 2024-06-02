import { runRequest } from '../../common/request_wrapper';
import { tables } from '../../common/constants';
import { knex } from '../../common/request_wrapper';
import { log } from '../../common/log';
import { prepareSettingsList } from './util';

export const updateSettings = async (req, context) => runRequest(req, context, async function (req, user_id) {
    let settings_list = JSON.parse(req.body);
    if (!Array.isArray(settings_list)) {
        settings_list = [settings_list];
    }
    prepareSettingsList(settings_list, user_id);
    await knex(tables.settings)
        .insert(settings_list)
        .onConflict(['key', 'user_id'])
        .merge(['value', 'modified_at']);
    await log(tables.settings, settings_list, user_id, knex);
});

export const getSettings = async (req, context) => runRequest(req, context, async function (req, user_id) {
    let key = null;
    if (req.pathParameters) {
        key = req.pathParameters.key;
    }
    let result = null;
    if (key) {
        result = await knex(tables.settings).select('*')
            .where('user_id', user_id).andWhere('key', key);
    } else {
        result = await knex(tables.settings).select('*')
            .where('user_id', user_id)
    }
    return result;

});