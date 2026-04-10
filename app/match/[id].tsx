import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import Button from "@/src/components/Button";
import Chip from "@/src/components/Chip";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { useFixture } from "@/src/hooks/useFixtures";
import { useTripsStore } from "@/src/state/trips";

import { beginPartnerClick } from "@/src/services/partnerClicks";
import {
  resolveTicketForFixture,
  type TicketResolutionOption,
  type TicketResolutionResult,
} from "@/src/services/ticketResolver";

import { getStadiumByTeamFromRegistry } from "@/src/data/stadiumRegistry";
import { normalizeTeamKey } from "@/src/data/teams";
import { normalizeCityKey } from "@/src/utils/city";

import {
  clean,
  mapTicketProviderToPartnerId,
  normalizeTicketUrlQuality,
  providerBadgeStyle,
  providerLabel,
  providerShort,
  splitTicketOptions,
  isStrongTicketOption,
  ticketUrlQualityLabel,
  optionReasonLabel,
  ticketConfidenceLabel,
  type SourceSection,
  type SourceSurface,
} from "@/src/features/tripDetail/helpers";

import type { PartnerId } from "@/src/constants/partners";

type RouteParams = Record<string, string | string[] | undefined>;
type MatchStrengthTone = "strong" | "medium" | "weak";

function getParam(params: RouteParams, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return clean(value[0]);
  return clean(value);
}

function formatKickoff(iso?: string | null): string {
  if (!iso) return "Kick-off TBC";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Kick-off TBC";

  const midnight = d.getHours() === 0 && d.getMinutes() === 0;
  if (midnight) {
    return (
      d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }) + " • TBC"
    );
  }

  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fixtureDateOnly(iso?: string | null): string {
  const value = clean(iso);
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

function inferTripWindowFromKickoff(kickoffIso?: string | null): {
  from?: string;
  to?: string;
} {
  const dateOnly = fixtureDateOnly(kickoffIso);
  if (!dateOnly) return {};

  const start = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(start.getTime())) return {};

  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  const toIso = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(
    end.getDate()
  ).padStart(2, "0")}`;

  return {
    from: dateOnly,
    to: toIso,
  };
}

function buildCanonicalTripBuildParams(args: {
  fixtureId: string;
  leagueId?: string;
  season?: string;
  city?: string;
  kickoffIso?: string;
  from?: string;
  to?: string;
}) {
  const fallbackWindow = inferTripWindowFromKickoff(args.kickoffIso);

  return {
    fixtureId: args.fixtureId,
    ...(clean(args.leagueId) ? { leagueId: clean(args.leagueId) } : {}),
    ...(clean(args.season) ? { season: clean(args.season) } : {}),
    ...(clean(args.city) ? { city: clean(args.city) } : {}),
    ...(clean(args.from)
      ? { from: clean(args.from) }
      : fallbackWindow.from
        ? { from: fallbackWindow.from }
        : {}),
    ...(clean(args.to)
      ? { to: clean(args.to) }
      : fallbackWindow.to
        ? { to: fallbackWindow.to }
        : {}),
  };
}

function getOptionRawScore(option: TicketResolutionOption): number | null {
  const raw = (option as TicketResolutionOption & { rawScore?: unknown }).rawScore;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function getTopLevelRawScore(result: TicketResolutionResult | null): number | null {
  const raw = (result as (TicketResolutionResult & { rawScore?: unknown }) | null)?.rawScore;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function getOptionUrlQuality(option: TicketResolutionOption) {
  return normalizeTicketUrlQuality(option.urlQuality, option.url);
}

function formatTicketPrice(price?: string | null, option?: TicketResolutionOption): string {
  const p = clean(price);
  const quality = option ? getOptionUrlQuality(option) : "unknown";
  const reason = clean(option?.reason);

  if (!p) {
    return quality === "search" || reason === "search_fallback"
      ? "Check price on partner"
      : "View live price";
  }

  if (/^[£€$]/.test(p)) {
    return quality === "search" || reason === "search_fallback" ? p : `From ${p}`;
  }

  if (/^(GBP|EUR|USD)\s/i.test(p)) {
    return quality === "search" || reason === "search_fallback" ? p : `From ${p}`;
  }

  return p;
}

function reasonTone(reason?: string | null): MatchStrengthTone {
  const raw = clean(reason);
  if (raw === "exact_event") return "strong";
  if (raw === "partial_match") return "medium";
  return "weak";
}

function summaryHeadline(
  result: TicketResolutionResult | null,
  strongCount: number,
  fallbackCount: number
): string {
  if (!result && strongCount === 0 && fallbackCount === 0) return "No results loaded";
  if (strongCount > 0) return "Strong ticket routes found";
  if (fallbackCount > 0) return "Only fallback ticket routes found";
  return "No ticket routes found";
}

function summaryBody(
  result: TicketResolutionResult | null,
  strongCount: number,
  fallbackCount: number
): string {
  if (!result && strongCount === 0 && fallbackCount === 0) {
    return "Tap Compare tickets to check all available providers for this fixture.";
  }

  if (strongCount > 0) {
    return "These include stronger routes like direct event pages or useful listing pages. Fallback marketplaces are shown separately below.";
  }

  if (fallbackCount > 0) {
    return "Only weaker fallback routes were found. They may still be useful, but they are not clean direct matches.";
  }

  return "No usable ticket routes were returned for this fixture right now.";
}

function resolverTone(
  result: TicketResolutionResult | null,
  strongCount: number,
  fallbackCount: number
): MatchStrengthTone {
  if (result?.ok || strongCount > 0) return "strong";
  if (fallbackCount > 0) return "weak";
  return "weak";
}

function ticketCardTone(option: TicketResolutionOption): MatchStrengthTone {
  if (isStrongTicketOption(option)) {
    return clean(option.reason) === "exact_event" ? "strong" : "medium";
  }
  return "weak";
}

function isOpenBlockedByWeakResult(option: TicketResolutionOption): boolean {
  return !isStrongTicketOption(option) && getOptionUrlQuality(option) === "search";
}

function buildReasonBody(reason?: string | null): string {
  const raw = clean(reason);

  if (raw === "exact_event") {
    return "This looks like a direct route for the exact fixture.";
  }

  if (raw === "partial_match") {
    return "This looks related and may still be useful, but it is weaker than a direct exact match.";
  }

  return "This is only a fallback search route. Treat it as a weaker lead, not a clean ticket match.";
}

function Crest({ name, uri }: { name: string; uri?: string | null }) {
  return (
    <View style={styles.crest}>
      {uri ? (
        <Image source={{ uri }} style={styles.crestImg} />
      ) : (
        <Text style={styles.crestFallback}>{name.slice(0, 2).toUpperCase()}</Text>
      )}
    </View>
  );
}

function GuideCard({
  title,
  subtitle,
  buttonLabel,
  onPress,
  disabled,
}: {
  title: string;
  subtitle: string;
  buttonLabel: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.guideCard, disabled && styles.guideCardDisabled]}>
      <View style={styles.guideCardTextWrap}>
        <Text style={styles.guideCardTitle}>{title}</Text>
        <Text style={styles.guideCardText}>{subtitle}</Text>
      </View>

      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[styles.guideButton, disabled && styles.guideButtonDisabled]}
      >
        <Text style={styles.guideButtonText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

function QualityPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "strong" | "medium" | "weak";
}) {
  return (
    <View
      style={[
        styles.qualityPill,
        tone === "strong"
          ? styles.qualityPillStrong
          : tone === "medium"
            ? styles.qualityPillMedium
            : tone === "weak"
              ? styles.qualityPillWeak
              : null,
      ]}
    >
      <Text style={styles.qualityPillText}>{label}</Text>
    </View>
  );
}

function ResolverBanner({
  tone,
  headline,
  body,
}: {
  tone: MatchStrengthTone;
  headline: string;
  body: string;
}) {
  return (
    <View
      style={[
        styles.banner,
        tone === "strong"
          ? styles.bannerStrong
          : tone === "medium"
            ? styles.bannerMedium
            : styles.bannerWeak,
      ]}
    >
      <Text style={styles.bannerTitle}>{headline}</Text>
      <Text style={styles.bannerText}>{body}</Text>
    </View>
  );
}

function SectionBadge({ label }: { label: string }) {
  return (
    <View style={styles.sectionBadge}>
      <Text style={styles.sectionBadgeText}>{label}</Text>
    </View>
  );
}

function TicketCard({
  option,
  isBest,
  onPress,
  loading,
  locked,
}: {
  option: TicketResolutionOption;
  isBest: boolean;
  onPress: () => void;
  loading: boolean;
  locked: boolean;
}) {
  const provider = providerLabel(option.provider);
  const providerBadge = providerBadgeStyle(option.provider);
  const urlQuality = getOptionUrlQuality(option);
  const rawScore = getOptionRawScore(option);
  const adjustedScore =
    typeof option.score === "number" && Number.isFinite(option.score) ? option.score : null;
  const reason = clean(option.reason);
  const tone = reasonTone(reason);
  const cardTone = ticketCardTone(option);
  const blockedWeakOpen = isOpenBlockedByWeakResult(option);

  return (
    <Pressable
      style={[
        styles.ticketCard,
        isBest && styles.ticketBest,
        cardTone === "weak" ? styles.ticketWeak : null,
      ]}
      onPress={onPress}
    >
      <View style={styles.ticketTopRow}>
        <Text style={styles.ticketPrice}>{formatTicketPrice(option.priceText, option)}</Text>

        <View
          style={[
            styles.providerBadge,
            {
              borderColor: providerBadge.borderColor,
              backgroundColor: providerBadge.backgroundColor,
            },
          ]}
        >
          <Text style={[styles.providerBadgeText, { color: providerBadge.textColor }]}>
            {providerShort(option.provider)}
          </Text>
        </View>
      </View>

      <Text style={styles.ticketProviderFull}>{provider}</Text>

      <View style={styles.ticketPillRow}>
        <QualityPill label={optionReasonLabel(reason)} tone={tone} />
        <QualityPill
          label={ticketUrlQualityLabel(urlQuality) || "Unknown route"}
          tone={urlQuality === "event" ? "strong" : urlQuality === "listing" ? "medium" : "weak"}
        />
        {isBest ? (
          <QualityPill
            label={cardTone === "weak" ? "Best fallback" : "Top option"}
            tone={cardTone}
          />
        ) : null}
      </View>

      <View style={styles.scoreRow}>
        {adjustedScore != null ? (
          <Text style={styles.scoreText}>
            Resolver score: {adjustedScore} • {ticketConfidenceLabel(adjustedScore)}
          </Text>
        ) : (
          <Text style={styles.scoreText}>Resolver score unavailable</Text>
        )}

        {rawScore != null && adjustedScore != null && rawScore !== adjustedScore ? (
          <Text style={styles.scoreSubText}>Raw {rawScore} → adjusted {adjustedScore}</Text>
        ) : null}
      </View>

      <Text style={styles.ticketMeta}>{buildReasonBody(reason)}</Text>

      {blockedWeakOpen ? (
        <Text style={styles.ticketWarning}>
          Weak search route only. Verify the fixture carefully on the partner page before trusting it.
        </Text>
      ) : null}

      <Text style={styles.ticketCTA}>
        {loading
          ? "Opening…"
          : locked
            ? "Start trip to open partner"
            : blockedWeakOpen
              ? "View fallback route on partner site"
              : "View on partner site"}
      </Text>
    </Pressable>
  );
}

export default function MatchScreen() {
  const router = useRouter();
  const rawParams = useLocalSearchParams() as RouteParams;

  const fixtureId = getParam(rawParams, "id");
  const tripId = getParam(rawParams, "tripId");
  const routeFrom = getParam(rawParams, "from");
  const routeTo = getParam(rawParams, "to");
  const routeLeagueId = getParam(rawParams, "leagueId");
  const routeSeason = getParam(rawParams, "season");

  const { fixture, loading } = useFixture(fixtureId);

  const trip = useTripsStore((s) =>
    tripId ? s.trips.find((t) => t.id === tripId) ?? null : null
  );

  const [ticketResult, setTicketResult] = useState<TicketResolutionResult | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [openingUrl, setOpeningUrl] = useState<string | null>(null);

  const home = clean(trip?.homeName ?? fixture?.teams?.home?.name);
  const away = clean(trip?.awayName ?? fixture?.teams?.away?.name);

  const kickoffIso = clean(trip?.kickoffIso ?? fixture?.fixture?.date);
  const kickoffText = formatKickoff(kickoffIso);

  const venueName = clean(fixture?.fixture?.venue?.name);
  const venueCity = clean(fixture?.fixture?.venue?.city);
  const venueLine = [venueName, venueCity].filter(Boolean).join(" • ");

  const crestHome = fixture?.teams?.home?.logo;
  const crestAway = fixture?.teams?.away?.logo;

  const effectiveLeagueId = clean(trip?.leagueId) || clean(fixture?.league?.id) || routeLeagueId;
  const effectiveLeagueName = clean(trip?.leagueName ?? fixture?.league?.name);
  const effectiveSeason =
    routeSeason || clean((fixture?.league as { season?: unknown } | undefined)?.season);

  const stadium = useMemo(() => {
    return home ? getStadiumByTeamFromRegistry(normalizeTeamKey(home)) : null;
  }, [home]);

  const teamGuideKey = useMemo(() => {
    return home ? normalizeTeamKey(home) : "";
  }, [home]);

  const cityGuideKey = useMemo(() => {
    return venueCity ? normalizeCityKey(venueCity) : "";
  }, [venueCity]);

  const tripBuildParams = useMemo(
    () =>
      buildCanonicalTripBuildParams({
        fixtureId,
        leagueId: effectiveLeagueId,
        season: effectiveSeason,
        city: venueCity || trip?.displayCity,
        kickoffIso,
        from: routeFrom,
        to: routeTo,
      }),
    [
      fixtureId,
      effectiveLeagueId,
      effectiveSeason,
      venueCity,
      trip?.displayCity,
      kickoffIso,
      routeFrom,
      routeTo,
    ]
  );

  const allOptions = useMemo(() => ticketResult?.options ?? [], [ticketResult]);
  const groupedOptions = useMemo(() => splitTicketOptions(allOptions), [allOptions]);
  const strongOptions = groupedOptions.strong;
  const fallbackOptions = groupedOptions.weak;

  const strongOptionCount = strongOptions.length;
  const weakOptionCount = fallbackOptions.length;
  const ticketsLocked = !clean(tripId);

  async function loadTickets() {
    if (loadingTickets) return;

    if (!fixtureId || !home || !away || !kickoffIso) {
      Alert.alert("Match data not ready yet");
      return;
    }

    setLoadingTickets(true);

    try {
      const res = await resolveTicketForFixture({
        fixtureId,
        homeName: home,
        awayName: away,
        kickoffIso,
        leagueId: effectiveLeagueId || undefined,
        leagueName: effectiveLeagueName || undefined,
      });

      setTicketResult(res);
    } catch {
      Alert.alert("Couldn’t load tickets");
    } finally {
      setLoadingTickets(false);
    }
  }

  async function openTicket(option: TicketResolutionOption) {
    if (!option.url) return;

    if (!tripId) {
      Alert.alert(
        "Start a trip first",
        "To open partner sites and track your own booking decisions in Wallet, start a trip from this match first."
      );
      buildTrip();
      return;
    }

    if (isOpenBlockedByWeakResult(option)) {
      Alert.alert(
        "Weak fallback route",
        "This is only a search-page fallback, not a strong direct match. Use it carefully and verify the fixture on the partner page before trusting it."
      );
    }

    let partnerId: PartnerId;
    try {
      partnerId = mapTicketProviderToPartnerId(option.provider);
    } catch {
      Alert.alert("Provider unsupported", "This ticket provider is not mapped yet.");
      return;
    }

    setOpeningUrl(option.url);

    try {
      await beginPartnerClick({
        tripId,
        partnerId,
        url: option.url,
        savedItemType: "tickets",
        title: option.title || `Tickets: ${home} vs ${away}`,
        metadata: {
          fixtureId,
          leagueId: effectiveLeagueId || undefined,
          leagueName: effectiveLeagueName || undefined,
          kickoffIso,
          homeName: home || undefined,
          awayName: away || undefined,
          venueName: venueName || undefined,
          venueCity: venueCity || undefined,
          resolvedPriceText: option.priceText ?? null,
          ticketProvider: option.provider ?? null,
          exactMatch: Boolean(option.exact),
          score: option.score,
          rawScore: getOptionRawScore(option),
          urlQuality: getOptionUrlQuality(option),
          resolutionReason: option.reason ?? null,
          sourceSurface: "match_screen" as SourceSurface,
          sourceSection: "tickets" as SourceSection,
          strongRoute: isStrongTicketOption(option),
        },
      });
    } catch {
      Alert.alert("Couldn’t open", "Try again in a moment.");
    } finally {
      setOpeningUrl(null);
    }
  }

  function goBack() {
    if (tripId) {
      router.push({ pathname: "/trip/[id]", params: { id: tripId } } as never);
      return;
    }
    router.back();
  }

  function buildTrip() {
    router.push({
      pathname: "/trip/build",
      params: tripBuildParams,
    } as never);
  }

  function openTeamGuide() {
    if (!teamGuideKey) {
      Alert.alert("Guide unavailable", "No team guide is available for this match yet.");
      return;
    }

    router.push({
      pathname: "/team/[teamKey]",
      params: {
        teamKey: teamGuideKey,
        from: routeFrom || tripBuildParams.from,
        to: routeTo || tripBuildParams.to,
      },
    } as never);
  }

  function openCityGuide() {
    if (!cityGuideKey) {
      Alert.alert("Guide unavailable", "No city guide is available for this match yet.");
      return;
    }

    router.push({
      pathname: "/city/key/[cityKey]",
      params: {
        cityKey: cityGuideKey,
        from: routeFrom || tripBuildParams.from,
        to: routeTo || tripBuildParams.to,
      },
    } as never);
  }

  if (!fixtureId) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <EmptyState title="Match not found" />
      </SafeAreaView>
    );
  }

  const bg = getBackground("match");
  const imageUrl = typeof bg === "string" ? bg : null;
  const imageSource = typeof bg === "string" ? null : bg;

  const topLevelRawScore = getTopLevelRawScore(ticketResult);
  const topLevelAdjustedScore =
    typeof ticketResult?.score === "number" && Number.isFinite(ticketResult.score)
      ? ticketResult.score
      : null;

  const bannerHeadline = summaryHeadline(ticketResult, strongOptionCount, weakOptionCount);
  const bannerBody = summaryBody(ticketResult, strongOptionCount, weakOptionCount);
  const bannerTone = resolverTone(ticketResult, strongOptionCount, weakOptionCount);

  return (
    <Background imageUrl={imageUrl} imageSource={imageSource} overlayOpacity={0.14}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Button label="Back" tone="secondary" size="sm" onPress={goBack} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard level="default" variant="matte" style={styles.heroCard} noPadding>
            <View style={styles.heroGlow} pointerEvents="none" />

            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <Text style={styles.heroKicker}>Match</Text>
                {fixture?.league?.name ? <Chip label={fixture.league.name} variant="default" /> : null}
              </View>

              <View style={styles.teamsRow}>
                <View style={styles.teamCol}>
                  <Crest name={home || "Home"} uri={crestHome} />
                  <Text style={styles.teamLabel} numberOfLines={2}>
                    {home || "Home"}
                  </Text>
                </View>

                <View style={styles.vsCol}>
                  <Text style={styles.vsText}>vs</Text>
                </View>

                <View style={styles.teamCol}>
                  <Crest name={away || "Away"} uri={crestAway} />
                  <Text style={styles.teamLabel} numberOfLines={2}>
                    {away || "Away"}
                  </Text>
                </View>
              </View>

              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle}>
                  {home && away ? `${home} vs ${away}` : "Match"}
                </Text>
                <Text style={styles.heroMeta}>{kickoffText}</Text>
                {!!venueLine && <Text style={styles.heroSub}>{venueLine}</Text>}
              </View>

              <View style={styles.heroActions}>
                <Button
                  label={loadingTickets ? "Checking tickets…" : "Compare tickets"}
                  tone="primary"
                  loading={loadingTickets}
                  onPress={loadTickets}
                  glow
                />
                <Button label="Plan trip from this match" tone="secondary" onPress={buildTrip} />
              </View>
            </View>
          </GlassCard>

          <GlassCard level="default" variant="matte" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>Tickets</Text>
                <Text style={styles.sectionSub}>
                  {ticketsLocked
                    ? "You can compare the full marketplace spread here, but open partner sites from a trip if you want your own booking actions tracked in Wallet."
                    : "Stronger routes are shown first. Fallback marketplaces are still shown, but clearly marked so the user is not misled."}
                </Text>
              </View>
            </View>

            {ticketResult ? (
              <>
                <ResolverBanner tone={bannerTone} headline={bannerHeadline} body={bannerBody} />

                <View style={styles.resolverSummaryWrap}>
                  <View style={styles.resolverSummaryRow}>
                    <Text style={styles.resolverSummaryLabel}>Resolver result</Text>
                    <Text style={styles.resolverSummaryValue}>
                      {ticketResult.ok
                        ? optionReasonLabel(ticketResult.reason)
                        : "No strong resolver success"}
                    </Text>
                  </View>

                  <View style={styles.resolverSummaryRow}>
                    <Text style={styles.resolverSummaryLabel}>Providers checked</Text>
                    <Text style={styles.resolverSummaryValue}>
                      {Array.isArray(ticketResult.checkedProviders) &&
                      ticketResult.checkedProviders.length > 0
                        ? ticketResult.checkedProviders.map(providerLabel).join(" • ")
                        : "—"}
                    </Text>
                  </View>

                  <View style={styles.resolverSummaryRow}>
                    <Text style={styles.resolverSummaryLabel}>Route mix</Text>
                    <Text style={styles.resolverSummaryValue}>
                      {strongOptionCount > 0
                        ? `${strongOptionCount} stronger route${strongOptionCount === 1 ? "" : "s"}`
                        : "No stronger routes"}
                      {weakOptionCount > 0
                        ? ` • ${weakOptionCount} fallback marketplace${weakOptionCount === 1 ? "" : "s"}`
                        : ""}
                    </Text>
                  </View>

                  {topLevelAdjustedScore != null ? (
                    <View style={styles.resolverSummaryRow}>
                      <Text style={styles.resolverSummaryLabel}>Top score</Text>
                      <Text style={styles.resolverSummaryValue}>
                        {topLevelAdjustedScore}
                        {topLevelRawScore != null && topLevelRawScore !== topLevelAdjustedScore
                          ? ` (raw ${topLevelRawScore})`
                          : ""}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : null}

            {strongOptions.length > 0 ? (
              <View style={styles.ticketSection}>
                <View style={styles.ticketSectionHeader}>
                  <Text style={styles.ticketSectionTitle}>Best routes</Text>
                  <SectionBadge label={`${strongOptions.length}`} />
                </View>

                <View style={styles.ticketList}>
                  {strongOptions.map((option, index) => (
                    <TicketCard
                      key={`strong-${option.provider}-${option.url}-${index}`}
                      option={option}
                      isBest={index === 0}
                      loading={openingUrl === option.url}
                      locked={ticketsLocked}
                      onPress={() => openTicket(option)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {fallbackOptions.length > 0 ? (
              <View style={styles.ticketSection}>
                <View style={styles.ticketSectionHeader}>
                  <Text style={styles.ticketSectionTitle}>More marketplaces</Text>
                  <SectionBadge label={`${fallbackOptions.length}`} />
                </View>

                <Text style={styles.fallbackIntro}>
                  These are weaker routes. They can still be useful for coverage, but they are not as trustworthy as direct event or listing matches.
                </Text>

                <View style={styles.ticketList}>
                  {fallbackOptions.map((option, index) => (
                    <TicketCard
                      key={`fallback-${option.provider}-${option.url}-${index}`}
                      option={option}
                      isBest={false}
                      loading={openingUrl === option.url}
                      locked={ticketsLocked}
                      onPress={() => openTicket(option)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {strongOptions.length === 0 && fallbackOptions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No ticket routes loaded yet</Text>
                <Text style={styles.emptyText}>
                  Tap “Compare tickets” first. This screen now shows the full provider spread instead of hiding marketplaces behind a top-3 cut.
                </Text>
              </View>
            ) : null}
          </GlassCard>

          <GlassCard level="default" variant="matte" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>About this trip</Text>
                <Text style={styles.sectionSub}>Useful planning context before you commit.</Text>
              </View>
            </View>

            <View style={styles.guideList}>
              <GuideCard
                title="Home team guide"
                subtitle={
                  home
                    ? `Matchday feel, stadium context and planning notes for ${home}.`
                    : "Open the home team guide."
                }
                buttonLabel="Open guide"
                onPress={openTeamGuide}
                disabled={!teamGuideKey}
              />

              <GuideCard
                title="City guide"
                subtitle={
                  venueCity
                    ? `Stay areas, transport basics and city-break context for ${venueCity}.`
                    : "Open the city guide."
                }
                buttonLabel="Open guide"
                onPress={openCityGuide}
                disabled={!cityGuideKey}
              />
            </View>

            {stadium ? (
              <View style={styles.localInfoWrap}>
                {!!stadium.airport ? (
                  <Text style={styles.localInfoLine}>Airport: {stadium.airport}</Text>
                ) : null}

                {Array.isArray(stadium.transit) && stadium.transit.length > 0 ? (
                  <Text style={styles.localInfoLine}>
                    Getting there: {stadium.transit[0].label}
                    {typeof stadium.transit[0].minutes === "number"
                      ? ` • ${stadium.transit[0].minutes} min`
                      : ""}
                  </Text>
                ) : null}

                {Array.isArray(stadium.stayAreas) && stadium.stayAreas.length > 0 ? (
                  <Text style={styles.localInfoLine}>
                    Best area to stay: {stadium.stayAreas[0].area}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Local basics not available yet</Text>
                <Text style={styles.emptyText}>
                  You can still compare tickets and build the trip from this match.
                </Text>
              </View>
            )}
          </GlassCard>

          {loading ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.loadingText}>Loading match details…</Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: 14,
  },

  heroCard: {
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
  },

  heroGlow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: -12,
    height: 68,
    borderRadius: 999,
    backgroundColor: "rgba(0,210,106,0.10)",
  },

  heroInner: {
    padding: 16,
    gap: 14,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  heroKicker: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.75,
    textTransform: "uppercase",
  },

  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  teamCol: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },

  vsCol: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  vsText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  teamLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  heroInfo: {
    alignItems: "center",
    gap: 4,
  },

  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  heroMeta: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
  },

  heroSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.medium,
    textAlign: "center",
  },

  heroActions: {
    gap: 10,
  },

  crest: {
    width: 86,
    height: 86,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  crestImg: {
    width: 58,
    height: 58,
    opacity: 0.98,
  },

  crestFallback: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 14,
  },

  sectionCard: {
    padding: 16,
    borderRadius: 24,
    gap: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionTitleWrap: {
    flex: 1,
    gap: 4,
  },

  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  sectionSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  banner: {
    gap: 4,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },

  bannerStrong: {
    backgroundColor: "rgba(87,162,56,0.08)",
    borderColor: "rgba(87,162,56,0.22)",
  },

  bannerMedium: {
    backgroundColor: "rgba(120,170,255,0.08)",
    borderColor: "rgba(120,170,255,0.20)",
  },

  bannerWeak: {
    backgroundColor: "rgba(255,200,80,0.08)",
    borderColor: "rgba(255,200,80,0.22)",
  },

  bannerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  bannerText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  resolverSummaryWrap: {
    gap: 8,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  resolverSummaryRow: {
    gap: 3,
  },

  resolverSummaryLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  resolverSummaryValue: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.semibold,
  },

  ticketSection: {
    gap: 10,
  },

  ticketSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 2,
  },

  ticketSectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  sectionBadge: {
    minWidth: 28,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionBadgeText: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  fallbackIntro: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.medium,
  },

  ticketList: {
    gap: 10,
  },

  ticketCard: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 8,
  },

  ticketBest: {
    borderColor: "rgba(87,162,56,0.25)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  ticketWeak: {
    borderColor: "rgba(255,200,80,0.22)",
    backgroundColor: "rgba(255,200,80,0.06)",
  },

  ticketTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  ticketPrice: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: theme.fontWeight.black,
    flex: 1,
  },

  providerBadge: {
    minWidth: 44,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  providerBadgeText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  ticketProviderFull: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: theme.fontWeight.semibold,
  },

  ticketPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  qualityPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  qualityPillStrong: {
    borderColor: "rgba(87,162,56,0.34)",
    backgroundColor: "rgba(87,162,56,0.12)",
  },

  qualityPillMedium: {
    borderColor: "rgba(120,170,255,0.34)",
    backgroundColor: "rgba(120,170,255,0.12)",
  },

  qualityPillWeak: {
    borderColor: "rgba(255,200,80,0.34)",
    backgroundColor: "rgba(255,200,80,0.12)",
  },

  qualityPillText: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  scoreRow: {
    gap: 2,
  },

  scoreText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: theme.fontWeight.black,
  },

  scoreSubText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: theme.fontWeight.medium,
  },

  ticketMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.medium,
  },

  ticketWarning: {
    color: "rgba(255,215,140,1)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.semibold,
  },

  ticketCTA: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  emptyBox: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 6,
  },

  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  guideList: {
    gap: 10,
  },

  guideCard: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 10,
  },

  guideCardDisabled: {
    opacity: 0.65,
  },

  guideCardTextWrap: {
    gap: 4,
  },

  guideCardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  guideCardText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  guideButton: {
    alignSelf: "flex-start",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.28)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  guideButtonDisabled: {
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  guideButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  localInfoWrap: {
    gap: 10,
  },

  localInfoLine: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  loadingWrap: {
    paddingTop: 2,
  },

  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
    paddingTop: 8,
  },
});
