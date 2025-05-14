import { conductorClient } from '@/common/conductor';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TenantService {
  async findAll() {
    // const allData = await axios.get('http://localhost:9200/conductor/_count?pretty');
    const data = await conductorClient.workflowResource.searchV21();
    return data;
  }
  async findAllEs() {
    try {
      const res = await axios.get('http://localhost:9200/conductor_workflow/_search?pretty&size=10000');

      // Check for successful response
      if (res.status === 200) {
        return res.data;
      } else {
        // Handle non-200 status codes
        return { error: 'Unexpected response status', status: res.status };
      }
    } catch (error) {
      // Handle any network or other errors
      return { error: 'Request failed', details: error.message };
    }
  }
}
