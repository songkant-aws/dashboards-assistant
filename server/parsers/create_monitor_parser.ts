/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage } from '../../common/types/chat_saved_object_attributes';
import { MessageParser } from '../types';

export const CreateMonitorParsers: MessageParser = {
  id: 'create_monitor_message',
  async parserProvider(interaction) {
    const monitorParameters: string[] =
      (interaction.additional_info?.['GetCreateMonitorParametersTool.output'] as
        | string[]
        | null)?.flatMap((item: string) => {
        let parameters: string = '';
        try {
          const outputResp = JSON.parse(item);
          parameters = outputResp;
        } catch (e) {
          parameters = item;
        }

        return parameters;
      }) || [];

    if (!monitorParameters.length) return [];

    const createMonitorOutputs: IMessage[] = [...new Set(monitorParameters)]
      .filter((parameters) => parameters)
      .map((parameters) => ({
        type: 'output',
        content: parameters,
        contentType: 'create_monitor_grid',
        fullWidth: true,
        suggestedActions: [
          {
            message: 'Create Monitor in Alerting Dashboard',
            actionType: 'create_monitor_in_dashboard',
          },
        ],
      }));

    return createMonitorOutputs;
  },
};
