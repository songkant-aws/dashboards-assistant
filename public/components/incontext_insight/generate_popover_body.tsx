/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { IncontextInsight as IncontextInsightInput } from '../../types';
import { getNotifications, IncontextInsightRegistry } from '../../services';
import { HttpSetup } from '../../../../../src/core/public';
import { ASSISTANT_API } from '../../../common/constants/llm';
import { getAssistantRole } from '../../utils/constants';

export const GeneratePopoverBody: React.FC<{
  incontextInsight: IncontextInsightInput;
  registry?: IncontextInsightRegistry;
  httpSetup?: HttpSetup;
  closePopover: () => void;
}> = ({ incontextInsight, registry, httpSetup, closePopover }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLlmResponded, setIsLlmResponded] = useState(false);
  const [summary, setSummary] = useState('');
  const [conversationId, setConversationId] = useState('');
  const toasts = getNotifications().toasts;

  const onChatContinuation = () => {
    registry?.continueInChat(incontextInsight, conversationId);
    closePopover();
  };

  const onGenerateSummary = (summarizationQuestion: string) => {
    setIsLoading(true);
    setIsLlmResponded(false);
    const summarize = async () => {
      const contextContent = incontextInsight.contextProvider
        ? await incontextInsight.contextProvider()
        : '';

      await httpSetup
        ?.post(ASSISTANT_API.SEND_MESSAGE, {
          body: JSON.stringify({
            messages: [],
            input: {
              type: 'input',
              content: summarizationQuestion,
              contentType: 'text',
              context: { content: contextContent, dataSourceId: incontextInsight.datasourceId },
              promptPrefix: getAssistantRole(incontextInsight.key),
            },
          }),
        })
        .then((response) => {
          const interactionLength = response.interactions.length;
          if (interactionLength > 0) {
            setConversationId(response.interactions[interactionLength - 1].conversation_id);
          }

          const messageLength = response.messages.length;
          if (messageLength > 0 && response.messages[messageLength - 1].type === 'output') {
            setSummary(response.messages[messageLength - 1].content);
          }
          setIsLlmResponded(true);
        })
        .catch((error) => {
          toasts.addDanger(
            i18n.translate('assistantDashboards.incontextInsight.generateSummaryError', {
              defaultMessage: 'Generate summary error',
            })
          );
          setIsLoading(false);
        });
    };

    return summarize();
  };

  if (!isLoading)
    return (
      <EuiButton
        onClick={async () => {
          await onGenerateSummary(
            incontextInsight.suggestions && incontextInsight.suggestions.length > 0
              ? incontextInsight.suggestions[0]
              : 'Please summarize the input'
          );
        }}
      >
        {i18n.translate('assistantDashboards.incontextInsight.generateSummary', {
          defaultMessage: 'Generate summary',
        })}
      </EuiButton>
    );
  if (isLoading && !isLlmResponded)
    return (
      <EuiButton isLoading={isLoading}>
        {i18n.translate('assistantDashboards.incontextInsight.generatingSummary', {
          defaultMessage: 'Generating summary...',
        })}
      </EuiButton>
    );
  if (isLoading && isLlmResponded)
    return (
      <>
        <EuiPanel paddingSize="s" hasBorder hasShadow={false} color="plain">
          <EuiText size="s">{summary}</EuiText>
        </EuiPanel>
        <EuiSpacer size={'xs'} />
        <EuiPanel
          hasShadow={false}
          hasBorder={false}
          element="div"
          onClick={() => onChatContinuation()}
          grow={false}
          paddingSize="none"
          style={{ width: '120px', float: 'right' }}
        >
          <EuiFlexGroup gutterSize="none" style={{ marginTop: 5 }}>
            <EuiFlexItem grow={false}>
              <EuiIcon type={'chatRight'} style={{ marginRight: 5 }} />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="xs">
                {i18n.translate('assistantDashboards.incontextInsight.continueInChat', {
                  defaultMessage: 'Continue in chat',
                })}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </>
    );
};
