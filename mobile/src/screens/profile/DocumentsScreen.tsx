import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { FileText } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { C, display, body, mono } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { StatusPill } from '../../components/StatusPill';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useL } from '../../i18n/useLanguage';
import { useDocuments, useUploadDocument } from '../../hooks/useDocuments';
import type { DocumentRow, DocumentType } from '../../types/database';
import type { ProfileStackParamList } from '../../navigation/ProfileStack';
import type { DictKey } from '../../i18n/dict';

const DOC_TYPES: DocumentType[] = ['insurance', 'cdl', 'medical_card', 'rate_confirmation', 'other'];

const DOC_TYPE_KEY: Record<DocumentType, DictKey> = {
  insurance: 'docInsurance',
  cdl: 'docCdl',
  medical_card: 'docMedicalCard',
  rate_confirmation: 'docRateConfirmation',
  other: 'docOther',
};

const DOC_STATUS_LABEL: Record<DocumentRow['status'], string> = {
  pending_review: 'Pending Review',
  verified: 'Verified',
  expiring: 'Expiring',
  rejected: 'Rejected',
};

export function DocumentsScreen({ navigation }: NativeStackScreenProps<ProfileStackParamList, 'Documents'>) {
  const L = useL();
  const { data: documents, isLoading } = useDocuments();
  const uploadDocument = useUploadDocument();
  const [selectedType, setSelectedType] = useState<DocumentType>('insurance');

  const handlePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    uploadDocument.mutate({
      type: selectedType,
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType,
    });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={L('documents')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-4">
        <View className="rounded p-4" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
          <View className="mb-3 flex-row items-center justify-between">
            <Text style={[body, { color: C.paper, fontSize: 13, fontWeight: '600' }]}>{L('documents')}</Text>
            <FileText size={14} color={C.silver} />
          </View>

          {isLoading ? (
            <Text style={[body, { color: C.silver, fontSize: 12.5 }]}>{L('loading')}</Text>
          ) : documents?.length ? (
            <View className="gap-2.5">
              {documents.map((d) => (
                <View key={d.id} className="flex-row items-center justify-between">
                  <View>
                    <Text style={[body, { color: C.silver, fontSize: 12.5 }]}>{L(DOC_TYPE_KEY[d.type])}</Text>
                    <Text style={[mono, { color: C.silver, fontSize: 10, opacity: 0.7 }]}>
                      {new Date(d.uploaded_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <StatusPill status={DOC_STATUS_LABEL[d.status]} />
                </View>
              ))}
            </View>
          ) : (
            <Text style={[body, { color: C.silver, fontSize: 12.5 }]}>{L('noDocuments')}</Text>
          )}
        </View>

        <View className="rounded p-4 gap-3" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
          <Text style={[body, { color: C.silver, fontSize: 10, letterSpacing: 0.5 }]}>{L('documentType').toUpperCase()}</Text>
          <View className="flex-row flex-wrap gap-2">
            {DOC_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setSelectedType(t)}
                className="rounded px-3 py-1.5"
                style={{
                  backgroundColor: selectedType === t ? C.gold : 'transparent',
                  borderWidth: 1,
                  borderColor: selectedType === t ? C.gold : C.line,
                }}
              >
                <Text style={[body, { fontSize: 11.5, fontWeight: '500', color: selectedType === t ? C.bg : C.silver }]}>
                  {L(DOC_TYPE_KEY[t])}
                </Text>
              </Pressable>
            ))}
          </View>

          <PrimaryButton
            title={L('uploadDocument')}
            onPress={handlePick}
            loading={uploadDocument.isPending}
            variant="outline"
          />
        </View>
      </ScrollView>
    </View>
  );
}
