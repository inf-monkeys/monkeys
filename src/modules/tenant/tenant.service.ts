import { conductorClient } from '@/common/conductor';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

const searchQuery = {
  size: 10000, // Limit to 10 results
  from: 0, // Start from the beginning (skip 0 results)
  query: {
    match_all: {}, // Example query: fetch all documents
  },
  sort: [
    { startTime: 'asc' }, // Sort by start time descending for consistent pagination
  ],
};

@Injectable()
export class TenantService {
  async findAll() {
    // const allData = await axios.get('http://localhost:9200/conductor/_count?pretty');
    const data = await conductorClient.workflowResource.searchV21();
    return data;
  }
  async findAllEs() {
    try {
      const res = await axios.post('http://elasticsearch-master:9200/conductor_workflow/_search?pretty', searchQuery, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

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
