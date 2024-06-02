import { runRequest } from '../../common/request_wrapper';
import { tables } from '../../common/constants';
import { knex } from '../../common/request_wrapper';

export const getEmployees = async (req, context) => runRequest(req, context, async (_, user_id) => {
    const employees = await knex(tables.users)
        .where('belongs_to', user_id);
    return employees;
});

export const getEmployeesSettings = async (req, context) => runRequest(req, context, async (req, user_id) => {
    const employees_settings = await knex.raw("select * from("
        + " (select id"
        + " from users"
        + " where belongs_to = ?) as my_users"
        + " left join settings s"
        + " on my_users.id = s.user_id)", [user_id]);
    return employees_settings.rows;
})