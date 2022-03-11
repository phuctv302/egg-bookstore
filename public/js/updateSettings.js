/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

// KIND IS EITHER: DATA OR PASSWORD
export const updateSetting = async (data, type) => {
  try {
    const url =
      type === 'data'
        ? '/api/v1/users/updateMe'
        : '/api/v1/users/updateMyPassword';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully! `);
      window.setTimeout(() => location.reload(true), 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
