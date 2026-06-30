import {
  type BrandMemory,
  type ProjectId,
  ProjectRepository,
} from '@marketing-service/project-management';
import {
  BrandMemoryReaderPort,
  type BrandMemoryReadResult,
  type SeoBriefBrandMemorySnapshot,
  type SeoBriefJsonObject,
} from '@marketing-service/seo-briefing';
import { Inject, Injectable } from '@nestjs/common';

function toSnapshot(brandMemory: BrandMemory): SeoBriefBrandMemorySnapshot {
  return {
    brandName: brandMemory.brandName,
    productDescription: brandMemory.productDescription,
    targetAudience: brandMemory.targetAudience,
    targetAudiences: brandMemory.targetAudiences,
    keyMessage: brandMemory.keyMessage,
    defaultCta: brandMemory.defaultCta,
    brandConstraints: brandMemory.brandConstraints,
    claimsConstraints: brandMemory.claimsConstraints,
    approvedFacts: brandMemory.approvedFacts,
    forbiddenClaims: brandMemory.forbiddenClaims,
    glossary: brandMemory.glossary,
    bannedPhrases: brandMemory.bannedPhrases,
    requiredPhrases: brandMemory.requiredPhrases,
    brandDocs: brandMemory.brandDocs,
    adaptationPromptRules: brandMemory.adaptationPromptRules as unknown as SeoBriefJsonObject,
    seoCompetitors: brandMemory.seoCompetitors,
    seoCompetitorKeywordMap:
      brandMemory.seoCompetitorKeywordMap as SeoBriefBrandMemorySnapshot['seoCompetitorKeywordMap'],
  };
}

@Injectable()
export class ProjectBrandMemoryReader extends BrandMemoryReaderPort {
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
  ) {
    super();
  }

  async readByProjectId(projectId: string): Promise<BrandMemoryReadResult | null> {
    const project = await this.projectRepository.findById(projectId as ProjectId);
    if (!project) {
      return null;
    }

    return {
      projectId: project.id,
      projectName: project.name,
      brandMemorySnapshot: toSnapshot(project.brandMemory),
    };
  }
}
